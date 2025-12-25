// src/app/(admin)/settings/items/page.tsx
import { prisma } from "@/lib/db";
import ItemsClient from "./ui/ItemsClient";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.linenItem.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, sku: true, isActive: true },
  });

  return <ItemsClient initial={items} />;
}
