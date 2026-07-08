import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { PageHeader } from "@/components/mobile/PageHeader";
import { FreshStartClient } from "./FreshStartClient";

export default async function FreshStartPage() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) redirect("/app");

  const properties = await prisma.property.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-dvh bg-background pb-40">
      <PageHeader
        title="Fresh start"
        subtitle="Wipe the slate — count what's real"
      />
      <main className="mx-auto w-full max-w-md px-4 pt-4">
        <FreshStartClient properties={properties} />
      </main>
    </div>
  );
}
