-- AddForeignKey
ALTER TABLE "user_policy" ADD CONSTRAINT "user_policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_policy" ADD CONSTRAINT "user_policy_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
