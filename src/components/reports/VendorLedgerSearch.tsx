"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-4 rounded-2xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Laundry vendor</Label>
          <Select
            value={vendorId || undefined}
            onValueChange={setVendorId}
            disabled={!propertyId || vendors.length === 0}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Linen item</Label>
          <Select
            value={linenItemId || undefined}
            onValueChange={setLinenItemId}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {linenItems.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {it.name}
                  {it.sku ? ` · ${it.sku}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        type="button"
        className="w-full rounded-2xl sm:w-auto"
        disabled={!canSearch}
        onClick={apply}
      >
        <Search className="mr-2 h-4 w-4" />
        Show ledger
      </Button>
      {!propertyId ? (
        <p className="text-xs text-muted-foreground">
          Choose a property above first.
        </p>
      ) : vendors.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No vendor laundry locations for this property yet.
        </p>
      ) : null}
    </div>
  );
}
