import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyStateNoProperty() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">No property assigned</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Ask admin to assign a property.
      </CardContent>
    </Card>
  );
}
