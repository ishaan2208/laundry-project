"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/components/PropertyProvider";
import { PROPERTY_COOKIE, readRememberedPropertyId } from "@/lib/propertyPref";

/**
 * Renders nothing; keeps the app-wide hotel state (context + cookie +
 * localStorage) in sync with whatever hotel the current page resolved to —
 * no matter how it was chosen (picker, URL, filter sheet, single-hotel
 * auto-select).
 *
 * When the server resolved nothing but an older localStorage choice
 * exists (pre-cookie sessions), it migrates that choice once and
 * refreshes so the page picks it up. The cookie check makes this safe:
 * after one refresh the cookie exists, so it can never loop.
 */
export function RememberProperty({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const { propertyId: currentId, selectProperty } = useProperty();
  const migrated = React.useRef(false);

  React.useEffect(() => {
    if (propertyId) {
      if (propertyId !== currentId) selectProperty(propertyId);
      return;
    }

    if (migrated.current) return;
    const saved = readRememberedPropertyId();
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${PROPERTY_COOKIE}=`));
    if (saved && !hasCookie) {
      migrated.current = true;
      selectProperty(saved);
      router.refresh();
    }
  }, [propertyId, currentId, selectProperty, router]);

  return null;
}
