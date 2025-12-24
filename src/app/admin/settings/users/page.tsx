// src/app/(admin)/settings/users/page.tsx
import { getUsersAdmin } from "@/actions/admin/users/getUsers";
import UserEditSheet from "@/components/admin/UserEditSheet";

export default async function UsersSettingsPage() {
  const { users, properties } = await getUsersAdmin();

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Invite users in Clerk. After first login, assign role + properties
          here.
        </p>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <UserEditSheet key={u.id} user={u} properties={properties} />
        ))}
      </div>
    </div>
  );
}
