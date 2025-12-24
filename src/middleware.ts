// src/middleware.ts
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) return NextResponse.next();

    if (isAppRoute(req) || isAdminRoute(req)) {
      await auth.protect(); // redirects to sign-in automatically :contentReference[oaicite:2]{index=2}
    }

    if (isAdminRoute(req)) {
      const { sessionClaims } = await auth();

      // MVP: rely on Clerk publicMetadata role claim for edge-level block.
      // Keep DB as source of truth in server actions.
      const role =
        (sessionClaims as any)?.user?.public_metadata?.role ||
        (sessionClaims as any)?.publicMetadata?.role;

      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/app", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    // allowed authorized parties for Clerk (edge-level)
    authorizedParties: [
      "https://stayzenvana.com",
      "https://www.stayzenvana.com",
      "https://accounts.stayzenvana.com",
      "https://laundry.stayzenvana.com",
      "http://localhost:3000",
    ],
  }
);

// Clerk-recommended matcher (skip Next internals/static; run on API) :contentReference[oaicite:3]{index=3}
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
