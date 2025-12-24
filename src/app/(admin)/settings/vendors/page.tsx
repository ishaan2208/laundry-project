// src/app/(admin)/settings/vendors/page.tsx
import { prisma } from "@/lib/db";
import VendorsClient from "./ui/VendorsClient";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, phone: true, isActive: true },
  });

  return <VendorsClient initial={vendors} />;
}
