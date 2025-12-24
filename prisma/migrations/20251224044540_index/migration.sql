-- CreateIndex
CREATE INDEX "Location_vendorId_idx" ON "Location"("vendorId");

-- CreateIndex
CREATE INDEX "Transaction_voidedAt_idx" ON "Transaction"("voidedAt");

-- CreateIndex
CREATE INDEX "TransactionEntry_locationId_linenItemId_condition_idx" ON "TransactionEntry"("locationId", "linenItemId", "condition");
