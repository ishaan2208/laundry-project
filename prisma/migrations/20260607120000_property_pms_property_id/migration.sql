-- Idempotent: safe if column/index already exist from a partial run
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "pmsPropertyId" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "Property_pmsPropertyId_key" ON "Property"("pmsPropertyId");

-- Backfill known PMS property mappings (by legacy CUID)
UPDATE "Property" SET "pmsPropertyId" = 1 WHERE id = 'cmjit5fec00000jus9iv5e33l' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 2 WHERE id = 'cmjit5fed00010juscawwjtgk' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 3 WHERE id = 'cmjit5fed00020jus153iq3xb' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 5 WHERE id = 'cmjit5fed00030jush3szc50b' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 63 WHERE id = 'cmjit5fee00040jusbedegruh' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 67 WHERE id = 'cmjit5fee00050jus5aqrlfs5' AND "pmsPropertyId" IS NULL;

-- Backfill by property code when CUIDs differ (fresh seeds)
UPDATE "Property" SET "pmsPropertyId" = 1 WHERE code = 'H1' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 2 WHERE code = 'H2' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 3 WHERE code = 'H3' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 5 WHERE code = 'H4' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 63 WHERE code = 'H5' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 67 WHERE code = 'H6' AND "pmsPropertyId" IS NULL;
