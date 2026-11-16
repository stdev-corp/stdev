-- better-auth 1.7.3 restored the 1.6 account schema: accounts are identified
-- by (providerId, accountId) again and new rows no longer write `issuer`
-- (https://better-auth.com/docs/guides/1-7-upgrade-guide). With the column
-- still NOT NULL, the first Google sign-in of a new admin fails on INSERT.
--
-- Relax the constraint instead of dropping the column: the previous image
-- (better-auth 1.7.2) still reads and writes `issuer`, so this migration can
-- and must be applied BEFORE the new image is rolled out.
--
-- Rolling back to the 1.7.2 image is clean only while the new image has not
-- created an account: 1.7.2 looks accounts up by (issuer, accountId), misses
-- rows written with a NULL issuer and inserts a second row for the same
-- Google identity, which 1.7.3+ then rejects ("Multiple accounts match the
-- same accountId"). After such a rollback, delete the duplicate
-- (providerId, accountId) rows before deploying the new image again:
--   SELECT "providerId", "accountId", count(*) FROM "account"
--   GROUP BY 1, 2 HAVING count(*) > 1;
-- Drop the column in a later migration once 1.7.2 is no longer a rollback
-- target.

-- 1. New rows arrive without an issuer.
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;

-- 2. (issuer, accountId) is no longer the identity key.
DROP INDEX "account_issuer_accountId_key";
