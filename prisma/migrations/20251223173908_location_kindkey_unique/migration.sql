/*
  Warnings:

  - Made the column `kindKey` on table `Location` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "kindKey" SET NOT NULL;
