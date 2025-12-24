"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

export type FilterOption = { value: string; label: string };

export type FilterField =
  | {
      key: string;
      label: string;
      type: "select";
      options: FilterOption[];
      placeholder?: string;
    }
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "date" };

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  const v = value?.trim();
  if (!v) params.delete(key);
  else params.set(key, v);
}

export function ReportFiltersSheet(props: {
  title?: string;
  fields: FilterField[];
  buttonLabel?: string;
}) {
  const { title = "Filters", fields, buttonLabel = "Filters" } = props;
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {};
    fields.forEach((f) => (obj[f.key] = sp.get(f.key) ?? ""));
    return obj;
  });

  React.useEffect(() => {
    const obj: Record<string, string> = {};
    fields.forEach((f) => (obj[f.key] = sp.get(f.key) ?? ""));
    setDraft(obj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  function apply() {
    const params = new URLSearchParams(sp.toString());
    Object.entries(draft).forEach(([k, v]) => setOrDelete(params, k, v));
    // reset cursor when filters change
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function clear() {
    const params = new URLSearchParams(sp.toString());
    fields.forEach((f) => params.delete(f.key));
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 grid gap-4">
          {fields.map((f) => (
            <div key={f.key} className="grid gap-2">
              <Label htmlFor={f.key}>{f.label}</Label>

              {f.type === "text" ? (
                <Input
                  id={f.key}
                  value={draft[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                />
              ) : f.type === "date" ? (
                <Input
                  id={f.key}
                  type="date"
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                />
              ) : (
                <Select
                  value={draft[f.key] ?? ""}
                  onValueChange={(v) =>
                    // Select requires non-empty values for items. We use a
                    // sentinel (`__all`) for the All option and translate it
                    // back to an empty string in the draft state which the
                    // rest of the code expects to mean "no value".
                    setDraft((d) => ({
                      ...d,
                      [f.key]: v === "__all" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={f.placeholder ?? "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All</SelectItem>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={clear}>
            Clear
          </Button>
          <Button className="flex-1" onClick={apply}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
