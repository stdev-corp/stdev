-- better-auth 1.7 keys provider identities on (issuer, accountId) instead of
-- accountId alone, so `account.issuer` becomes a required column backed by a
-- unique compound index. Follow the documented order for a populated table:
-- add nullable -> backfill -> NOT NULL -> unique index.
-- https://better-auth.com/docs/guides/1-7-upgrade-guide

-- 1. Add the column as nullable so existing rows can be backfilled.
ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

-- 2. Backfill. better-auth 1.7.2 identifies Google accounts by the Google OIDC
--    issuer (Google is the only social provider configured in src/utils/auth.ts).
UPDATE "account"
SET "issuer" = 'https://accounts.google.com'
WHERE "issuer" IS NULL AND "providerId" = 'google';

--    Email/password accounts use better-auth's local credential namespace
--    (none are expected in this deployment; kept for completeness).
UPDATE "account"
SET "issuer" = 'local:credential'
WHERE "issuer" IS NULL AND "providerId" = 'credential';

--    Any other provider without an OIDC issuer falls back to better-auth's
--    synthetic local OAuth namespace.
UPDATE "account"
SET "issuer" = 'local:oauth:' || "providerId"
WHERE "issuer" IS NULL;

-- 3. Enforce the new constraint.
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

-- 4. Unique compound index (name matches Prisma's @@unique([issuer, accountId])).
CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");
