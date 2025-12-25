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
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SlidersHorizontal,
  Building2,
  Truck,
  Tag,
  CalendarRange,
  Search,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

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
  | { key: string; label: string; type: "date" }
  | { key: string; label: string; type: "switch" };

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  const v = value?.trim();
  if (!v) params.delete(key);
  else params.set(key, v);
}

function iconForKey(key: string) {
  if (key === "propertyId") return <Building2 className="h-4 w-4" />;
  if (key === "vendorId") return <Truck className="h-4 w-4" />;
  if (key === "type") return <Tag className="h-4 w-4" />;
  if (key === "from" || key === "to")
    return <CalendarRange className="h-4 w-4" />;
  if (key === "q") return <Search className="h-4 w-4" />;
  if (key === "includeVoided") return <EyeOff className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
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
  const reduceMotion = useReducedMotion();

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

  const activeCount = React.useMemo(() => {
    let c = 0;
    for (const f of fields) {
      const v = (sp.get(f.key) ?? "").trim();
      if (f.type === "switch") {
        if (v === "1") c++;
      } else if (v) c++;
    }
    return c;
  }, [fields, sp]);

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
        <Button
          variant="secondary"
          className="h-12 rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] hover:bg-violet-600/10 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
        >
          <SlidersHorizontal className="mr-2 h-5 w-5 text-violet-700 dark:text-violet-200" />
          {buttonLabel}
          {activeCount ? (
            <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white dark:bg-violet-500">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] rounded-t-3xl border-violet-200/60 bg-background/80 p-0 backdrop-blur-[2px] dark:border-violet-500/15"
      >
        <LazyMotion features={domAnimation}>
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex h-full flex-col"
          >
            {/* Header */}
            <div className="px-4 pt-4">
              <SheetHeader>
                <SheetTitle className="text-base">{title}</SheetTitle>
              </SheetHeader>

              <div className="mt-2 text-sm text-muted-foreground">
                Set quick filters. Typing is optional.
              </div>
            </div>

            <Separator className="mt-4 opacity-60" />

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              <div className="mt-4 grid gap-3">
                {fields.map((f) => {
                  const icon = iconForKey(f.key);

                  return (
                    <Card
                      key={f.key}
                      className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                          {icon}
                        </span>
                        <Label
                          htmlFor={f.key}
                          className="text-sm font-semibold"
                        >
                          {f.label}
                        </Label>
                      </div>

                      {f.type === "text" ? (
                        <Input
                          id={f.key}
                          value={draft[f.key] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                          }
                          className="h-14 rounded-2xl border-violet-200/60 bg-white/70 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                        />
                      ) : f.type === "date" ? (
                        <Input
                          id={f.key}
                          type="date"
                          value={draft[f.key] ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                          }
                          className="h-14 rounded-2xl border-violet-200/60 bg-white/70 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                        />
                      ) : f.type === "switch" ? (
                        <div className="flex items-center justify-between rounded-2xl border border-violet-200/60 bg-white/70 px-3 py-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                          <div className="text-sm text-muted-foreground">
                            Toggle to include voided rows
                          </div>
                          <Switch
                            checked={(draft[f.key] ?? "") === "1"}
                            onCheckedChange={(checked) =>
                              setDraft((d) => ({
                                ...d,
                                [f.key]: checked ? "1" : "",
                              }))
                            }
                          />
                        </div>
                      ) : (
                        <Select
                          value={draft[f.key] ?? ""}
                          onValueChange={(v) =>
                            setDraft((d) => ({
                              ...d,
                              [f.key]: v === "__all" ? "" : v,
                            }))
                          }
                        >
                          <SelectTrigger
                            id={f.key}
                            className="h-14 rounded-2xl border-violet-200/60 bg-white/70 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                          >
                            <SelectValue
                              placeholder={f.placeholder ?? "Select"}
                            />
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
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-violet-200/60 bg-background/80 px-4 py-3 backdrop-blur-[2px] dark:border-violet-500/15 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="h-14 flex-1 rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] hover:bg-violet-600/10 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
                  onClick={clear}
                >
                  Clear
                </Button>
                <Button
                  className="h-14 flex-1 rounded-2xl bg-violet-600 text-base font-semibold text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
                  onClick={apply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </m.div>
        </LazyMotion>
      </SheetContent>
    </Sheet>
  );
}
