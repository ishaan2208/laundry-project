// src/lib/auth.ts
import "server-only";

import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  propertyIds: string[]; // from UserProperty
};

class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "INACTIVE" | "BAD_AUTH_USER";
  status: number;
  constructor(
    code: AuthError["code"],
    message: string,
    status: number = code === "UNAUTHENTICATED" ? 401 : 403
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function getClerkPrimaryEmail(u: Awaited<ReturnType<typeof currentUser>>) {
  const email = u?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  return email || null;
}

/**
 * 1) Reads the signed-in Clerk user (throws if not signed in).
 */
export async function requireAuthUser() {
  const u = await currentUser();
  if (!u) throw new AuthError("UNAUTHENTICATED", "Please sign in.");
  const email = getClerkPrimaryEmail(u);
  if (!email) {
    // You can allow phone-only auth later, but DB schema requires email right now.
    throw new AuthError(
      "BAD_AUTH_USER",
      "No email found on this account. Please add an email in Clerk."
    );
  }
  return { clerkUser: u, email };
}

/**
 * 2) Ensure there is an internal User row for the Clerk user.
 *    - First try by authId
 *    - fallback by email (then attach authId)
 *    - else create new
 *
 * Role bootstrap:
 * - If env ADMIN_EMAILS includes this email -> ADMIN
 * - Else if this is the very first user -> ADMIN
 * - Else -> HOUSEKEEPING
 */
export async function getOrCreateAppUser() {
  const { clerkUser, email } = await requireAuthUser();
  const authId = clerkUser.id;

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? [];

  // 1) by authId
  const byAuthId = await prisma.user.findUnique({
    where: { authId },
    include: { properties: { select: { propertyId: true } } },
  });
  if (byAuthId) return byAuthId;

  // 2) by email
  const byEmail = await prisma.user.findUnique({
    where: { email },
    include: { properties: { select: { propertyId: true } } },
  });

  if (byEmail) {
    // attach authId if missing (or keep existing)
    if (!byEmail.authId) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { authId },
        include: { properties: { select: { propertyId: true } } },
      });
    }
    // If authId exists but doesn't match, keep DB as source of truth.
    // (You can decide to reconcile later.)
    return byEmail;
  }

  // 3) create
  const displayName =
    (clerkUser.fullName?.trim() ||
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
      null) ??
    null;

  const userCount = await prisma.user.count();
  const role: UserRole =
    adminEmails.includes(email) || userCount === 0
      ? UserRole.ADMIN
      : UserRole.HOUSEKEEPING;

  const created = await prisma.user.create({
    data: {
      email,
      name: displayName,
      authId,
      role,
      isActive: true,
    },
    include: { properties: { select: { propertyId: true } } },
  });

  return created;
}

/**
 * 3) Return internal user shape used everywhere.
 *    Cached per-request so multiple server actions/components don’t re-hit DB repeatedly.
 */
export const requireUser = cache(async (): Promise<AppUser> => {
  const u = await getOrCreateAppUser();

  if (!u.isActive) {
    throw new AuthError(
      "INACTIVE",
      "Your account is disabled. Contact admin.",
      403
    );
  }

  const propertyIds = (u.properties ?? []).map((p) => p.propertyId);

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    propertyIds,
  };
});

export function requireRole(user: AppUser, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw new AuthError("FORBIDDEN", "You do not have permission.", 403);
  }
}

export function requirePropertyAccess(user: AppUser, propertyId: string) {
  if (user.role === UserRole.ADMIN) return; // admins can access all
  if (!user.propertyIds.includes(propertyId)) {
    throw new AuthError("FORBIDDEN", "No access to this property.", 403);
  }
}

/** Optional helper for UI checks */
export function isAdmin(user: AppUser) {
  return user.role === UserRole.ADMIN;
}
