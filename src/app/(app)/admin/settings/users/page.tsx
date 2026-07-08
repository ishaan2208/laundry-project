// src/app/(admin)/settings/users/page.tsx
import { getUsersAdmin } from "@/actions/admin/users/getUsers";
import UserEditSheet from "@/components/admin/UserEditSheet";
import { UsersRound, Info } from "lucide-react";

export default async function UsersSettingsPage() {
  const { users, properties } = await getUsersAdmin();

  return (
    <div className="space-y-4">
      <div className="surface rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <UsersRound className="size-5" />
          </span>

          <div className="min-w-0">
            <div className="text-lg font-semibold">Users</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Invite users in Clerk — after first login, assign role +
              property access here.
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                Tip: Keep roles tight. Property access controls what they can
                operate on.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <UserEditSheet key={u.id} user={u} properties={properties} />
        ))}
      </div>
    </div>
  );
}
