"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { TxnType, UserRole } from "@/generated/prisma";
import { getPricingMapForVendor } from "@/actions/masters/getPricingMap";
import { apiRequest } from "@/lib/apiClient";

type LaundryTransactionType =
  | typeof TxnType.DISPATCH_TO_LAUNDRY
  | typeof TxnType.RECEIVE_FROM_LAUNDRY;

function monthRangeUTC(month: string) {
  // month: "2025-12"
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // next month
  return { start, end };
}

function getDaysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function formatDateKey(date: Date): string {
  // Format as YYYY-MM-DD
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getMonthlyCalendarReport(input: {
  propertyId: string;
  vendorId: string;
  month: string; // "YYYY-MM"
  transactionType: LaundryTransactionType;
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN, UserRole.HOUSEKEEPING]);
  await requirePropertyAccess(user, input.propertyId);

  const { start, end } = monthRangeUTC(input.month);
  const daysInMonth = getDaysInMonth(input.month);

  type CheckoutRoomsResponse = {
    propertyId: string;
    month: string;
    checkoutRoomsByDate: Record<string, number>;
  };

  let checkoutRoomsByDate: Record<string, number> = {};

  if (input.transactionType === TxnType.DISPATCH_TO_LAUNDRY) {
    // 🔴 Hard‑coded mapping between internal and external property IDs
    const externalPropertyId =
      {
        "cmjit5fed00030jush3szc50b": "5",
        "cmjit5fed00020jus153iq3xb": "3",
        "cmjit5fec00000jus9iv5e33l":"1",
        "cmjit5fee00040jusbedegruh":"63",
        "cmjit5fee00050jus5aqrlfs5":"67",
        "cmjit5fed00010juscawwjtgk":"2"
        // add more as needed
      }[input.propertyId] ?? "DEFAULT_EXTERNAL_PROP_ID";

    try {
      const data = await apiRequest<CheckoutRoomsResponse>({
        method: "GET",
        url: "/analytics/checkout-rooms",
        params: {
          propertyId: externalPropertyId, // 👈 send the mapped / hard‑coded ID
          month: input.month,
        },
      });
      console.log("checkout-rooms API response", data);
      checkoutRoomsByDate = data.checkoutRoomsByDate ?? {};
    } catch (error) {
      console.error("Error fetching checkout rooms", error);
      checkoutRoomsByDate = {};
    }
  }

  // Get all transactions for the month
  const transactions = await prisma.transaction.findMany({
    where: {
      propertyId: input.propertyId,
      vendorId: input.vendorId,
      type: input.transactionType,
      occurredAt: { gte: start, lt: end },
      voidedAt: null,
    },
    select: {
      id: true,
      occurredAt: true,
      entries: {
        where: {
          qtyDelta: { gt: 0 }, // Only positive quantities
        },
        select: {
          linenItemId: true,
          qtyDelta: true,
        },
      },
    },
  });

  // Get all unique linen item IDs
  const itemIds = new Set<string>();
  for (const txn of transactions) {
    for (const entry of txn.entries) {
      itemIds.add(entry.linenItemId);
    }
  }

  // Fetch linen item names
  const items = await prisma.linenItem.findMany({
    where: { id: { in: Array.from(itemIds) } },
    select: { id: true, name: true },
  });
  const itemNameMap = new Map(items.map((i) => [i.id, i.name]));

  // Fetch pricing for the vendor
  const pricingMap = await getPricingMapForVendor(input.vendorId);

  // Build data structure: itemId -> date -> quantity
  const dataMap = new Map<
    string,
    Map<string, number>
  >();

  // Initialize all items with all dates set to 0
  for (const itemId of itemIds) {
    const dateMap = new Map<string, number>();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${input.month}-${String(day).padStart(2, "0")}`;
      dateMap.set(dateKey, 0);
    }
    dataMap.set(itemId, dateMap);
  }

  // Populate with actual data
  for (const txn of transactions) {
    const dateKey = formatDateKey(txn.occurredAt);
    // Only process if the date key is within the month range
    if (dateKey.startsWith(input.month)) {
      for (const entry of txn.entries) {
        const dateMap = dataMap.get(entry.linenItemId);
        if (dateMap && dateMap.has(dateKey)) {
          const current = dateMap.get(dateKey) || 0;
          dateMap.set(dateKey, current + entry.qtyDelta);
        }
      }
    }
  }

  // Convert to array format
  const rows = Array.from(dataMap.entries()).map(([itemId, dateMap]) => {
    const dates: Record<string, number> = {};
    const dateCosts: Record<string, number> = {};
    let total = 0;
    let totalCost = 0;
    const unitPrice = pricingMap.get(itemId) ?? null;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${input.month}-${String(day).padStart(2, "0")}`;
      const qty = dateMap.get(dateKey) || 0;
      dates[dateKey] = qty;
      const cost = unitPrice !== null ? qty * unitPrice : null;
      if (cost !== null) {
        dateCosts[dateKey] = cost;
        totalCost += cost;
      }
      total += qty;
    }

    return {
      linenItemId: itemId,
      linenItemName: itemNameMap.get(itemId) ?? "Unknown",
      dates,
      dateCosts,
      total,
      totalCost: unitPrice !== null ? totalCost : null,
      unitPrice,
    };
  });

  // Sort by total descending
  rows.sort((a, b) => b.total - a.total);

  // Generate date headers
  const dateHeaders: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dateHeaders.push(`${input.month}-${String(day).padStart(2, "0")}`);
  }

  return {
    ok: true as const,
    month: input.month,
    transactionType: input.transactionType,
    dateHeaders,
    rows,
    // ⚠️ Backend: replace this placeholder with real data from PMS.
    checkoutRoomsByDate,
  };
}
