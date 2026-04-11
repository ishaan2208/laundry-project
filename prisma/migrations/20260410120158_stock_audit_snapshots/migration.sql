-- CreateTable
CREATE TABLE "StockAuditSnapshot" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "includeVendor" BOOLEAN NOT NULL,
    "includeDiscarded" BOOLEAN NOT NULL,

    CONSTRAINT "StockAuditSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAuditSnapshotLine" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "linenItemId" TEXT NOT NULL,
    "totalQty" INTEGER NOT NULL,
    "breakdown" JSONB,

    CONSTRAINT "StockAuditSnapshotLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAuditSnapshot_propertyId_weekStart_idx" ON "StockAuditSnapshot"("propertyId", "weekStart");

-- CreateIndex
CREATE INDEX "StockAuditSnapshot_weekStart_idx" ON "StockAuditSnapshot"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "StockAuditSnapshot_propertyId_weekStart_includeVendor_inclu_key" ON "StockAuditSnapshot"("propertyId", "weekStart", "includeVendor", "includeDiscarded");

-- CreateIndex
CREATE INDEX "StockAuditSnapshotLine_snapshotId_idx" ON "StockAuditSnapshotLine"("snapshotId");

-- CreateIndex
CREATE INDEX "StockAuditSnapshotLine_linenItemId_idx" ON "StockAuditSnapshotLine"("linenItemId");

-- AddForeignKey
ALTER TABLE "StockAuditSnapshot" ADD CONSTRAINT "StockAuditSnapshot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAuditSnapshot" ADD CONSTRAINT "StockAuditSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAuditSnapshotLine" ADD CONSTRAINT "StockAuditSnapshotLine_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "StockAuditSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAuditSnapshotLine" ADD CONSTRAINT "StockAuditSnapshotLine_linenItemId_fkey" FOREIGN KEY ("linenItemId") REFERENCES "LinenItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
