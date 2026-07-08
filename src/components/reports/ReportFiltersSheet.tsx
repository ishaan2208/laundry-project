"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/components/PropertyProvider";

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

/**
 * Filter drawer for report pages. Same props API and URL-param behavior as
 * before — server pages read the same query keys.
 */
export function ReportFiltersSheet(props: {
  title?: string;
  fields: FilterField[];
  buttonLabel?: string;
}) {
  const { title = "Filters", fields, buttonLabel = "Filters" } = props;

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { selectProperty } = useProperty();

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

    // A hotel picked here changes the app-wide selection, like any picker.
    const pickedProperty = draft.propertyId?.trim();
    if (pickedProperty) selectProperty(pickedProperty);

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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="secondary" size="lg">
          <SlidersHorizontal className="size-5" />
          {buttonLabel}
          {activeCount ? (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            Set quick filters. Typing is optional.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-3 px-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label
                htmlFor={f.key}
                className="text-sm font-medium text-muted-foreground"
              >
                {f.label}
              </Label>

              {f.type === "text" ? (
                <Input
                  id={f.key}
                  value={draft[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  className="h-12 rounded-xl text-base"
                />
              ) : f.type === "date" ? (
                <Input
                  id={f.key}
                  type="date"
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  className="h-12 rounded-xl text-base"
                />
              ) : f.type === "switch" ? (
                <div className="flex min-h-12 items-center justify-between rounded-xl bg-muted px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">
                    Toggle to include cancelled entries
                  </span>
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
                  <SelectTrigger id={f.key} className="h-12 w-full rounded-xl text-base">
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
        </DrawerBody>

        <DrawerFooter className={cn("flex-row gap-2")}>
          <Button
            type="button"
            variant="secondary"
            size="xl"
            className="flex-1"
            onClick={clear}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="xl"
            className="flex-1"
            onClick={apply}
          >
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
