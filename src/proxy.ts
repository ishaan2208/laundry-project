import type { NextRequest } from "next/server";
import middleware, { config as middlewareConfig } from "./middleware";

// Proxy wrapper that delegates to the existing middleware implementation.
// This keeps a single source of truth (middleware.ts) while providing the
// proxy entrypoint Next.js expects when using the new Proxy convention.
export default function proxy(request: NextRequest) {
  // middleware is a function compatible with Next's middleware handler
  // so we can directly call it with the request object.
  // Note: middleware may also rely on response helpers; if you observe
  // any mismatches, we can inline the logic instead.
  return (middleware as any)(request);
}

export const config = middlewareConfig;
