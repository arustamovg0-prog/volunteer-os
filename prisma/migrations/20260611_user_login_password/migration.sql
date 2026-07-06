ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "login" TEXT,
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_login_key" ON "users" ("login");
