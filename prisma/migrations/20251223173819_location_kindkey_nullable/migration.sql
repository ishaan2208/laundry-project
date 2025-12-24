/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,kindKey]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kindKey" TEXT;

-- CreateIndex
CREATE INDEX "Location_propertyId_kindKey_idx" ON "Location"("propertyId", "kindKey");

-- CreateIndex
CREATE UNIQUE INDEX "Location_propertyId_kindKey_key" ON "Location"("propertyId", "kindKey");
