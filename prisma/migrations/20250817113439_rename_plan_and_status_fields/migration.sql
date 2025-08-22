/*
  Warnings:

  - You are about to drop the column `plan` on the `Stores` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Stores` table. All the data in the column will be lost.
  - The `plan_type` column on the `Stores` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Stores" DROP COLUMN "plan",
DROP COLUMN "status",
ADD COLUMN     "plan_billing_cycle" TEXT,
ADD COLUMN     "plan_status" TEXT DEFAULT 'inactive',
DROP COLUMN "plan_type",
ADD COLUMN     "plan_type" INTEGER DEFAULT 0;
