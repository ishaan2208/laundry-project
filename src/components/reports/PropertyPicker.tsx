"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PropertyPicker({
  properties,
  current,
}: {
  properties: { id: string; name: string }[];
  current?: string | undefined;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [value, setValue] = React.useState<string>(
    current ?? sp.get("propertyId") ?? ""
  );

  React.useEffect(() => {
    setValue(current ?? sp.get("propertyId") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, sp.toString()]);

  function onChange(v: string) {
    setValue(v);
    const params = new URLSearchParams(sp.toString());
    // Select requires non-empty values for items. We use a sentinel value
    // (`__all`) to represent the empty selection and translate it here.
    if (!v || v === "__all") params.delete("propertyId");
    else params.set("propertyId", v);
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="sm:hidden w-48">
      <Label className="text-xs">Property</Label>
      <Select value={value} onValueChange={(v) => onChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
