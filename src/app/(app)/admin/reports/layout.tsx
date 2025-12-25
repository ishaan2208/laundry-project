import { ReactNode } from "react";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { Separator } from "@/components/ui/separator";

export default async function ReportsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]); // add ACCOUNTANT later if you want

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold leading-tight">Reports</div>
              <div className="text-sm text-muted-foreground">
                Stock, vendor pending, monthly cleaned, logs
              </div>
            </div>
          </div>

          <div className="mt-3">
            <ReportsNav />
          </div>
        </div>
        <Separator />
      </div>

      {/* Page body */}
      <main className="mx-auto w-full max-w-5xl px-4 py-4">{children}</main>
    </div>
  );
}
