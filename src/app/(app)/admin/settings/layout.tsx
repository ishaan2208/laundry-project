// src/app/(admin)/settings/layout.tsx
import * as React from "react";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import SettingsNav from "./_components/SettingsNav";
import { Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <Card className="rounded-3xl border bg-background/40 p-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      Settings
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Admin controls • users, properties, locations, items
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <SettingsNav />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-24">
        {children}
      </main>
    </div>
  );
}
