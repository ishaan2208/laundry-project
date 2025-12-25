import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package } from "lucide-react";

export function VendorMonthlyCleanedList(props: {
  lines: { linenItemId: string; linenItemName: string; qtyCleaned: number }[];
}) {
  const max = Math.max(1, ...props.lines.map((l) => l.qtyCleaned));

  if (!props.lines.length) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <div className="font-medium">No cleaned entries</div>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Nothing received from this vendor in the selected month.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="px-1 pb-2 text-sm font-medium">By Item</div>
      <div className="space-y-3">
        {props.lines.map((l) => {
          const pct = Math.round((l.qtyCleaned / max) * 100);
          return (
            <div key={l.linenItemId} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{l.linenItemName}</div>
                  <div className="mt-2">
                    <Progress value={pct} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Qty</div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {l.qtyCleaned}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
