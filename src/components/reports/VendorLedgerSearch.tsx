"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { Search } from "lucide-react";

export type VendorLedgerSearchProps = {
  vendors: { id: string; name: string }[];
  linenItems: { id: string; name: string; sku: string | null }[];
  selectedVendorId?: string;
  selectedLinenItemId?: string;
};

export function VendorLedgerSearch({
  vendors,
  linenItems,
  selectedVendorId,
  selectedLinenItemId,
}: VendorLedgerSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const propertyId = sp.get("propertyId") ?? "";

  const [vendorId, setVendorId] = React.useState(selectedVendorId ?? "");
  const [linenItemId, setLinenItemId] = React.useState(
    selectedLinenItemId ?? ""
  );

  React.useEffect(() => {
    setVendorId(selectedVendorId ?? "");
  }, [selectedVendorId]);

  React.useEffect(() => {
    setLinenItemId(selectedLinenItemId ?? "");
  }, [selectedLinenItemId]);

  function apply() {
    const next = new URLSearchParams();
    if (propertyId) next.set("propertyId", propertyId);
    if (vendorId) next.set("vendorId", vendorId);
    if (linenItemId) next.set("linenItemId", linenItemId);
    router.push(`${pathname}?${next.toString()}`);
  }

  const canSearch = Boolean(propertyId && vendorId && linenItemId);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <BottomSheetSelect
          label="Laundry"
          value={vendorId}
          onChange={setVendorId}
          options={vendors.map((v) => ({ value: v.id, label: v.name }))}
          placeholder="Choose laundry"
          hint="Which laundry vendor?"
          disabled={!propertyId || vendors.length === 0}
          leadingIcon="truck"
        />
        <BottomSheetSelect
          label="Linen item"
          value={linenItemId}
          onChange={setLinenItemId}
          options={linenItems.map((it) => ({
            value: it.id,
            label: it.name,
            subtitle: it.sku ?? undefined,
          }))}
          placeholder="Choose item"
          hint="Which linen item?"
        />
      </div>

      <Button
        type="button"
        size="xl"
        className="w-full"
        disabled={!canSearch}
        onClick={apply}
      >
        <Search className="size-5" />
        Show ledger
      </Button>

      {!propertyId ? (
        <p className="text-sm text-muted-foreground">
          Choose a hotel above first.
        </p>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No laundry vendors set up for this hotel yet.
        </p>
      ) : null}
    </div>
  );
}
