// src/app/(admin)/settings/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SelfHealCard from "./_components/SelfHealCard";

export default async function SettingsHomePage() {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Masters</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Manage Properties, Vendors, Items, and Locations. No deletes — only
          disable.
        </CardContent>
      </Card>

      <SelfHealCard />
    </div>
  );
}
