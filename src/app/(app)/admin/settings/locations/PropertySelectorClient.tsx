"use client";

import * as React from "react";
import { PropertySelector } from "@/components/dashboard/PropertySelector";

export default function PropertySelectorClient({
  properties,
  selectedPropertyId,
}: {
  properties: { id: string; name: string }[];
  selectedPropertyId?: string | null;
}) {
  return (
    <div className="mb-4">
      <PropertySelector
        properties={properties}
        selectedPropertyId={selectedPropertyId ?? undefined}
      />
    </div>
  );
}
