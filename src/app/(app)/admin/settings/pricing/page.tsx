// src/app/(app)/admin/settings/pricing/page.tsx
import { prisma } from "@/lib/db";
import { getPricing } from "@/actions/masters/getPricing";
import PricingClient from "./ui/PricingClient";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
    const [result, vendors, items] = await Promise.all([
        getPricing(),
        prisma.vendor.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.linenItem.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <PricingClient
            initial={result.ok ? result.pricing : []}
            vendors={vendors}
            items={items}
        />
    );
}
