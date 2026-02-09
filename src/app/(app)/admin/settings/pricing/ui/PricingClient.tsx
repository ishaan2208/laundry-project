"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
    IndianRupee,
    Plus,
    Pencil,
    Trash2,
    Save,
    Info,
    Truck,
    Package,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { upsertPricing } from "@/actions/masters/upsertPricing";
import { deletePricing } from "@/actions/masters/deletePricing";

type Row = {
    id: string;
    vendorId: string;
    vendorName: string;
    linenItemId: string;
    linenItemName: string;
    unitPrice: number;
    createdAt: Date;
    updatedAt: Date;
};

type PricingClientProps = {
    initial: Row[];
    vendors: { id: string; name: string }[];
    items: { id: string; name: string }[];
};

export default function PricingClient({
    initial,
    vendors,
    items,
}: PricingClientProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const reduceMotion = useReducedMotion();

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const editing = useMemo(
        () => initial.find((x) => x.id === editId) ?? null,
        [editId, initial]
    );

    const [vendorId, setVendorId] = useState("");
    const [linenItemId, setLinenItemId] = useState("");
    const [unitPrice, setUnitPrice] = useState("");

    function startAdd() {
        setEditId(null);
        setVendorId("");
        setLinenItemId("");
        setUnitPrice("");
        setOpen(true);
    }

    function startEdit(row: Row) {
        setEditId(row.id);
        setVendorId(row.vendorId);
        setLinenItemId(row.linenItemId);
        setUnitPrice(row.unitPrice.toString());
        setOpen(true);
    }

    async function save() {
        if (!vendorId || !linenItemId || !unitPrice) return;

        const res = await upsertPricing({
            id: editId ?? undefined,
            vendorId,
            linenItemId,
            unitPrice: parseFloat(unitPrice),
        });
        if (res?.ok) {
            setOpen(false);
            router.refresh();
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this pricing entry?")) return;
        await deletePricing(id);
        router.refresh();
    }

    const activeVendors = vendors.filter((v) => v);
    const activeItems = items.filter((i) => i);

    return (
        <LazyMotion features={domAnimation}>
            <div className="space-y-4">
                {/* Header */}
                <Card className="rounded-3xl border bg-background/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
                                    <IndianRupee className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-base font-semibold">Pricing</div>
                                    <div className="text-xs text-muted-foreground">
                                        {initial.length} entries • Vendor-specific item pricing
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-start gap-2 rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-4 w-4" />
                                <div className="min-w-0">
                                    Set unit prices for laundry items per vendor. Used in calendar
                                    reports for cost calculations.
                                </div>
                            </div>
                        </div>

                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button className="h-11 rounded-2xl gap-2" onClick={startAdd}>
                                    <Plus className="h-4 w-4" />
                                    Add
                                </Button>
                            </SheetTrigger>

                            <SheetContent
                                side="bottom"
                                className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
                            >
                                <div className="px-4 pt-4">
                                    <SheetHeader>
                                        <SheetTitle className="flex items-center gap-2">
                                            <IndianRupee className="h-5 w-5" />
                                            {editing ? "Edit Pricing" : "Add Pricing"}
                                        </SheetTitle>
                                    </SheetHeader>

                                    {editing ? (
                                        <div className="mt-3 rounded-2xl border bg-background/50 p-3">
                                            <div className="text-xs text-muted-foreground">Editing</div>
                                            <div className="mt-1 text-sm font-semibold truncate">
                                                {editing.vendorName} - {editing.linenItemName}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                                    <div className="mt-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Truck className="h-4 w-4" />
                                                Vendor
                                            </Label>
                                            <Select
                                                value={vendorId}
                                                onValueChange={setVendorId}
                                                disabled={!!editing}
                                            >
                                                <SelectTrigger className="h-12 rounded-2xl">
                                                    <SelectValue placeholder="Select vendor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeVendors.map((v) => (
                                                        <SelectItem key={v.id} value={v.id}>
                                                            {v.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Linen Item
                                            </Label>
                                            <Select
                                                value={linenItemId}
                                                onValueChange={setLinenItemId}
                                                disabled={!!editing}
                                            >
                                                <SelectTrigger className="h-12 rounded-2xl">
                                                    <SelectValue placeholder="Select item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeItems.map((i) => (
                                                        <SelectItem key={i.id} value={i.id}>
                                                            {i.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4" />
                                                Unit Price (₹)
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={unitPrice}
                                                onChange={(e) => setUnitPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="h-12 rounded-2xl"
                                            />
                                        </div>

                                        <div className="rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
                                            This price will be used to calculate total costs in calendar
                                            reports.
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-12 flex-1 rounded-2xl"
                                            onClick={() => setOpen(false)}
                                            disabled={pending}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="h-12 flex-1 rounded-2xl gap-2"
                                            disabled={
                                                pending ||
                                                !vendorId ||
                                                !linenItemId ||
                                                !unitPrice ||
                                                parseFloat(unitPrice) <= 0
                                            }
                                            onClick={() => startTransition(save)}
                                        >
                                            <Save className="h-4 w-4" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </Card>

                {/* List */}
                <div className="space-y-2">
                    {initial.map((x) => (
                        <m.div
                            key={x.id}
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.16,
                                ease: "easeOut",
                            }}
                        >
                            <Card className="rounded-3xl border bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
                                <CardContent className="flex items-start justify-between gap-3 p-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="truncate text-sm font-semibold">
                                                {x.vendorName}
                                            </div>
                                        </div>

                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {x.linenItemName}
                                        </div>

                                        <div className="mt-2 text-sm font-semibold text-foreground">
                                            ₹{x.unitPrice.toFixed(2)} per unit
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-10 rounded-2xl gap-2"
                                                onClick={() => startEdit(x)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-10 rounded-2xl gap-2"
                                                onClick={() => startTransition(() => handleDelete(x.id))}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </m.div>
                    ))}
                </div>
            </div>
        </LazyMotion>
    );
}
