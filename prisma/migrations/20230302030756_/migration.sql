-- CreateEnum
CREATE TYPE "TfaStatusEnum" AS ENUM ('init', 'enable', 'disable');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('regular', 'admin');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "googleId" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "tfaStatus" "TfaStatusEnum" NOT NULL DEFAULT 'init',
    "tfaSecret" TEXT,
    "role" "Role",
    "permissions" JSONB,
    "facebookId" TEXT,
    "recoveryCode" TEXT,
    "githubId" TEXT,
    "microsoftId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
