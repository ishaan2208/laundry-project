import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldAlert } from "lucide-react";

export function EmptyStateNoProperty() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 ring-1 ring-white/15 dark:ring-white/10">
          <ShieldAlert className="h-5 w-5 text-fuchsia-300" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold">No property assigned</div>
            <Badge
              variant="secondary"
              className="border border-white/15 bg-white/50 dark:border-white/10 dark:bg-white/5"
            >
              Action needed
            </Badge>
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Ask admin to assign a property to your account.
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Once assigned, you’ll see dispatch/receive options here.
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
