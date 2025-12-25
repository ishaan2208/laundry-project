"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { runMastersSelfHeal } from "@/actions/masters/runMastersSelfHeal";
import { useRouter } from "next/navigation";

export default function SelfHealCard() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Self-heal Defaults</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Re-create missing default locations and vendor-locations.
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await runMastersSelfHeal();
              router.refresh();
            })
          }
        >
          Run
        </Button>
      </CardContent>
    </Card>
  );
}
