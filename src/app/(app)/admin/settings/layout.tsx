// src/app/(admin)/settings/layout.tsx
import * as React from "react";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import SettingsNav from "./_components/SettingsNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="text-lg font-semibold">Settings</div>
          <div className="mt-2">
            <SettingsNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 pb-24">{children}</main>
    </div>
  );
}
