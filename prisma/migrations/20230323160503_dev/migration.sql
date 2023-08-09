/*
  Warnings:

  - Added the required column `createdBy` to the `policy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "policy" ADD COLUMN     "createdBy" INTEGER NOT NULL;
