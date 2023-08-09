/*
  Warnings:

  - The `permissions` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PermissionsType" AS ENUM ('create_coffee', 'update_coffee', 'delete_coffee');

-- AlterTable
ALTER TABLE "user" DROP COLUMN "permissions",
ADD COLUMN     "permissions" "PermissionsType"[] DEFAULT ARRAY[]::"PermissionsType"[];
