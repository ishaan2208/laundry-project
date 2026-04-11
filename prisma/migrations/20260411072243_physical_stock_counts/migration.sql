-- CreateEnum
CREATE TYPE "PhysicalStockCountStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PhysicalStockCount" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "includeVendor" BOOLEAN NOT NULL,
    "includeDiscarded" BOOLEAN NOT NULL,
    "status" "PhysicalStockCountStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "staffNote" TEXT,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "approvalTransactionId" TEXT,

    CONSTRAINT "PhysicalStockCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalStockCountLine" (
    "id" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "linenItemId" TEXT NOT NULL,
    "countedQty" INTEGER NOT NULL,
    "bookQtyAtSubmit" INTEGER NOT NULL,

    CONSTRAINT "PhysicalStockCountLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalStockCount_approvalTransactionId_key" ON "PhysicalStockCount"("approvalTransactionId");

-- CreateIndex
CREATE INDEX "PhysicalStockCount_propertyId_status_idx" ON "PhysicalStockCount"("propertyId", "status");

-- CreateIndex
CREATE INDEX "PhysicalStockCount_status_submittedAt_idx" ON "PhysicalStockCount"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "PhysicalStockCountLine_countId_idx" ON "PhysicalStockCountLine"("countId");

-- CreateIndex
CREATE INDEX "PhysicalStockCountLine_linenItemId_idx" ON "PhysicalStockCountLine"("linenItemId");

-- AddForeignKey
ALTER TABLE "PhysicalStockCount" ADD CONSTRAINT "PhysicalStockCount_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockCount" ADD CONSTRAINT "PhysicalStockCount_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockCount" ADD CONSTRAINT "PhysicalStockCount_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockCount" ADD CONSTRAINT "PhysicalStockCount_approvalTransactionId_fkey" FOREIGN KEY ("approvalTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockCountLine" ADD CONSTRAINT "PhysicalStockCountLine_countId_fkey" FOREIGN KEY ("countId") REFERENCES "PhysicalStockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockCountLine" ADD CONSTRAINT "PhysicalStockCountLine_linenItemId_fkey" FOREIGN KEY ("linenItemId") REFERENCES "LinenItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
