// src/app/(admin)/settings/page.tsx
import SelfHealCard from "./_components/SelfHealCard";

export default async function SettingsHomePage() {
  return (
    <div className="space-y-3">
      <div className="surface rounded-2xl p-4">
        <h2 className="text-base font-semibold">Masters</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage properties, laundry vendors, items, and locations. No
          deletes — only disable.
        </p>
      </div>

      <SelfHealCard />
    </div>
  );
}
