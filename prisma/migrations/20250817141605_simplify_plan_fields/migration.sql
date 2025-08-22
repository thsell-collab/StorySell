/*
  Warnings:

  - You are about to drop the column `plan_amount` on the `Stores` table. All the data in the column will be lost.
  - You are about to drop the column `plan_name` on the `Stores` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stores" DROP COLUMN "plan_amount",
DROP COLUMN "plan_name";
