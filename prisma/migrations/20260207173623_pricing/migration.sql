-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "linenItemId" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pricing_vendorId_idx" ON "Pricing"("vendorId");

-- CreateIndex
CREATE INDEX "Pricing_linenItemId_idx" ON "Pricing"("linenItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_vendorId_linenItemId_key" ON "Pricing"("vendorId", "linenItemId");

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_linenItemId_fkey" FOREIGN KEY ("linenItemId") REFERENCES "LinenItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
