ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "availability_status" TEXT NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS "available_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "availability_note" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_id_key" ON "users"("telegram_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_memberships_org_id_user_id_key"
  ON "organization_memberships"("org_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "access_keys_category_username_key"
  ON "access_keys"("category", "username");
CREATE INDEX IF NOT EXISTS "resource_allocations_resource_id_status_idx"
  ON "resource_allocations"("resource_id", "status");
CREATE INDEX IF NOT EXISTS "resource_allocations_project_id_idx"
  ON "resource_allocations"("project_id");
