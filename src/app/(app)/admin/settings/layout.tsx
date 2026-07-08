// src/app/(admin)/settings/layout.tsx
import * as React from "react";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import SettingsNav from "./_components/SettingsNav";
import { Settings2 } from "lucide-react";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-(--z-header) border-b bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <div className="surface rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Settings2 className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  Settings
                </div>
                <div className="text-sm text-muted-foreground">
                  Admin controls · users, properties, locations, items
                </div>
              </div>
            </div>

            <div className="mt-3">
              <SettingsNav />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-24">
        {children}
      </main>
    </div>
  );
}
