-- CreateTable
CREATE TABLE "user_policy" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "policyId" INTEGER NOT NULL,

    CONSTRAINT "user_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "statement" JSONB NOT NULL,

    CONSTRAINT "policy_pkey" PRIMARY KEY ("id")
);
