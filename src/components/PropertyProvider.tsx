"use client";

import * as React from "react";
import { rememberProperty } from "@/lib/propertyPref";

type PropertyContextValue = {
  /** The app-wide selected hotel. Null until one is known. */
  propertyId: string | null;
  /** Select a hotel everywhere at once (state + cookie + localStorage). */
  selectProperty: (id: string) => void;
};

const PropertyContext = React.createContext<PropertyContextValue>({
  propertyId: null,
  selectProperty: () => {},
});

/**
 * One sustained hotel selection for the whole app. The server layout seeds
 * it from the cookie, so it survives reloads and new visits; every picker,
 * flow, and filter feeds back into it through selectProperty.
 */
export function PropertyProvider({
  initialPropertyId,
  children,
}: {
  initialPropertyId?: string;
  children: React.ReactNode;
}) {
  const [propertyId, setPropertyId] = React.useState<string | null>(
    initialPropertyId ?? null
  );

  const selectProperty = React.useCallback((id: string) => {
    setPropertyId(id);
    rememberProperty(id);
  }, []);

  const value = React.useMemo(
    () => ({ propertyId, selectProperty }),
    [propertyId, selectProperty]
  );

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  return React.useContext(PropertyContext);
}
