"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
        <div className="space-y-4">
            {/* Header */}
            <div className="surface rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                                <IndianRupee className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold">Pricing</div>
                                <div className="text-sm text-muted-foreground">
                                    {initial.length} entries · Vendor-specific item pricing
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <div className="min-w-0">
                                Set unit prices for laundry items per vendor. Used in calendar
                                reports for cost calculations.
                            </div>
                        </div>
                    </div>

                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button size="lg" onClick={startAdd}>
                                <Plus className="size-4" />
                                Add
                            </Button>
                        </SheetTrigger>

                        <SheetContent
                            side="bottom"
                            className="h-[92vh] max-h-[92vh] flex-col rounded-t-3xl p-0"
                        >
                            <div className="px-4 pt-4">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <IndianRupee className="size-5" />
                                        {editing ? "Edit pricing" : "Add pricing"}
                                    </SheetTitle>
                                </SheetHeader>

                                {editing ? (
                                    <div className="mt-3 rounded-xl bg-muted p-3">
                                        <div className="text-sm text-muted-foreground">Editing</div>
                                        <div className="mt-1 truncate text-sm font-semibold">
                                            {editing.vendorName} - {editing.linenItemName}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                                <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Truck className="size-4" />
                                            Laundry vendor
                                        </Label>
                                        <Select
                                            value={vendorId}
                                            onValueChange={setVendorId}
                                            disabled={!!editing}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl text-base">
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
                                        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="size-4" />
                                            Linen item
                                        </Label>
                                        <Select
                                            value={linenItemId}
                                            onValueChange={setLinenItemId}
                                            disabled={!!editing}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl text-base">
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
                                        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <IndianRupee className="size-4" />
                                            Unit price (₹)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="h-12 rounded-xl text-base"
                                        />
                                    </div>

                                    <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                                        This price will be used to calculate total costs in calendar
                                        reports.
                                    </div>
                                </div>
                            </div>

                            <div className="border-t bg-card px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        className="flex-1"
                                        onClick={() => setOpen(false)}
                                        disabled={pending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="flex-1"
                                        disabled={
                                            pending ||
                                            !vendorId ||
                                            !linenItemId ||
                                            !unitPrice ||
                                            parseFloat(unitPrice) <= 0
                                        }
                                        onClick={() => startTransition(save)}
                                    >
                                        <Save className="size-4" />
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {initial.map((x) => (
                    <div key={x.id} className="surface rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold">
                                    {x.vendorName}
                                </div>

                                <div className="mt-1 text-sm text-muted-foreground">
                                    {x.linenItemName}
                                </div>

                                <div
                                    data-numeric
                                    className="mt-2 text-sm font-semibold text-foreground"
                                >
                                    ₹{x.unitPrice.toFixed(2)} per unit
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => startEdit(x)}
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => startTransition(() => handleDelete(x.id))}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
