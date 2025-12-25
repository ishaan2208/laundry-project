// src/app/(admin)/settings/users/page.tsx
import { getUsersAdmin } from "@/actions/admin/users/getUsers";
import UserEditSheet from "@/components/admin/UserEditSheet";
import { Card } from "@/components/ui/card";
import { UsersRound, Info } from "lucide-react";

export default async function UsersSettingsPage() {
  const { users, properties } = await getUsersAdmin();

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border bg-background/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
            <UsersRound className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold">Users</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Invite users in Clerk → after first login, assign role + property
              access here.
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4" />
              <div className="min-w-0">
                Tip: Keep roles tight. Property access controls what they can
                operate on.
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {users.map((u) => (
          <UserEditSheet key={u.id} user={u} properties={properties} />
        ))}
      </div>
    </div>
  );
}
