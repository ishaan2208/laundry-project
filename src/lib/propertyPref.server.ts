import "server-only";

import { cookies } from "next/headers";
import { PROPERTY_COOKIE } from "./propertyPref";

/**
 * Which hotel is this page about?
 * Remembered cookie → URL param → the only accessible hotel → undefined.
 * The cookie wins so the app-wide selection is sustained: a stale link or
 * old bookmark can never silently flip the whole app to another hotel
 * (every in-app hotel change writes the cookie first, so fresh links
 * always agree with it). Both values are validated against the accessible
 * list, so a stale or forged value can never select a hotel the user
 * cannot see.
 */
export async function resolvePropertyId(
  paramPropertyId: string | undefined,
  accessible: { id: string }[]
): Promise<string | undefined> {
  const jar = await cookies();
  const remembered = jar.get(PROPERTY_COOKIE)?.value;
  if (remembered && accessible.some((p) => p.id === remembered)) {
    return remembered;
  }

  if (paramPropertyId && accessible.some((p) => p.id === paramPropertyId)) {
    return paramPropertyId;
  }

  if (accessible.length === 1) return accessible[0].id;
  return undefined;
}
