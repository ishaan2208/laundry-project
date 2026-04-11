import { PrismaClient } from "@/generated/prisma";
import type { PrismaClient as PrismaClientType } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClientType {
  return new PrismaClient({
    log: ["error", "warn"],
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

function hasPhysicalCountDelegate(client: PrismaClientType): boolean {
  return (
    typeof (client as { physicalStockCount?: { findMany?: unknown } })
      .physicalStockCount?.findMany === "function"
  );
}

function resolvePrismaClient(): PrismaClientType {
  const existing = globalForPrisma.prisma;
  if (existing && hasPhysicalCountDelegate(existing)) {
    return existing;
  }
  if (existing) {
    void existing.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }
  const client = createPrismaClient();
  if (!hasPhysicalCountDelegate(client)) {
    throw new Error(
      "Prisma client is out of date (missing physicalStockCount). From laundry-project run `npx prisma generate`, then restart `npm run dev`."
    );
  }
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Lazy singleton so a dev server that started before `prisma generate` (or with a
 * stale global) does not keep a PrismaClient missing newer model delegates.
 */
export const prisma = new Proxy({} as PrismaClientType, {
  get(_target, prop, receiver) {
    const client = resolvePrismaClient();
    const value = Reflect.get(client, prop, receiver) as unknown;
    if (typeof value === "function") {
      return (value as (...a: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
