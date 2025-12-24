// src/app/(admin)/settings/properties/page.tsx
import { prisma } from "@/lib/db";
import PropertiesClient from "./ui/PropertiesClient";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      createdAt: true,
    },
  });

  return <PropertiesClient initial={properties} />;
}
