// src/components/reports/ReportFiltersSheet.tsx
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
    params.delete("cursor"); // reset cursor when filters change
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

      {/* ✅ 90vh sheet + proper padding + scroll region so keyboard won't hide content */}
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] p-0 rounded-t-2xl flex flex-col"
      >
        <div className="px-4 pt-4">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        </div>

        {/* scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
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
                      // Select requires non-empty values for items.
                      // We use sentinel `__all` for "All", stored as empty string in draft.
                      setDraft((d) => ({
                        ...d,
                        [f.key]: v === "__all" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger id={f.key}>
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
        </div>

        {/* fixed footer actions (with safe-area padding) */}
        <div className="px-4 py-3 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={clear}>
              Clear
            </Button>
            <Button className="flex-1" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
