-- AlterTable
ALTER TABLE "Property" ADD COLUMN "pmsPropertyId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Property_pmsPropertyId_key" ON "Property"("pmsPropertyId");

-- Backfill known PMS property mappings (by legacy CUID)
UPDATE "Property" SET "pmsPropertyId" = 1 WHERE id = 'cmjit5fec00000jus9iv5e33l';
UPDATE "Property" SET "pmsPropertyId" = 2 WHERE id = 'cmjit5fed00010juscawwjtgk';
UPDATE "Property" SET "pmsPropertyId" = 3 WHERE id = 'cmjit5fed00020jus153iq3xb';
UPDATE "Property" SET "pmsPropertyId" = 5 WHERE id = 'cmjit5fed00030jush3szc50b';
UPDATE "Property" SET "pmsPropertyId" = 63 WHERE id = 'cmjit5fee00040jusbedegruh';
UPDATE "Property" SET "pmsPropertyId" = 67 WHERE id = 'cmjit5fee00050jus5aqrlfs5';

-- Backfill by property code when CUIDs differ (fresh seeds)
UPDATE "Property" SET "pmsPropertyId" = 1 WHERE code = 'H1' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 2 WHERE code = 'H2' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 3 WHERE code = 'H3' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 5 WHERE code = 'H4' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 63 WHERE code = 'H5' AND "pmsPropertyId" IS NULL;
UPDATE "Property" SET "pmsPropertyId" = 67 WHERE code = 'H6' AND "pmsPropertyId" IS NULL;
