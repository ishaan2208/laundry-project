import { Building2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function EmptyStateNoProperty() {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-accent">
        <Building2 className="size-9 text-accent-foreground" />
      </span>
      <h1 className="mt-5 text-xl font-bold">No hotel assigned yet</h1>
      <p className="mt-2 max-w-xs text-base text-muted-foreground">
        Ask your manager to add you to a hotel. Once that is done, your work
        will show up here.
      </p>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
