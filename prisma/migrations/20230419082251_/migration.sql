-- CreateTable
CREATE TABLE "webhook" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "api" TEXT NOT NULL,

    CONSTRAINT "webhook_pkey" PRIMARY KEY ("id")
);
