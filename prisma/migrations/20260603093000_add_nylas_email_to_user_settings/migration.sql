-- Store the connected Nylas grant's email address alongside the grant id so the
-- Settings > Integrations UI can show "Connected as <email>" without an extra
-- round-trip to the Nylas API. Nullable: only set once a grant is connected.
ALTER TABLE "UserSettings" ADD COLUMN "nylasEmail" TEXT;
