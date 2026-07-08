import { ReactNode } from "react";
import Link from "next/link";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";

export default async function PhysicalStockCountsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/settings" className="hover:underline">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/physical-stock-counts" className="font-medium text-foreground hover:underline">
            Physical counts
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-4">{children}</div>
    </div>
  );
}
