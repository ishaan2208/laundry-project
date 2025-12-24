import { Card, CardContent } from "@/components/ui/card";
import type { DashboardSummary } from "@/actions/reports/getDashboardSummary";

export function TodayTiles({ summary }: { summary: DashboardSummary }) {
  const tiles = [
    { label: "Dispatched", value: summary.dispatched },
    { label: "Received", value: summary.received },
    { label: "Procured", value: summary.procured },
    { label: "Discarded", value: summary.discarded },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {t.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
