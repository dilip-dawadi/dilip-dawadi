-- Migration from better-auth to NextAuth
-- WARNING: This will delete all existing sessions and accounts
-- User data will be preserved with the role field

-- Drop old better-auth tables
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;

-- Update user table to match NextAuth requirements
ALTER TABLE "user" 
  DROP COLUMN IF EXISTS "created_at",
  DROP COLUMN IF EXISTS "updated_at",
  ALTER COLUMN "email_verified" TYPE timestamp USING NULL,
  ALTER COLUMN "email_verified" DROP NOT NULL,
  ALTER COLUMN "name" DROP NOT NULL;

-- Rename user table to users (NextAuth convention)
ALTER TABLE "user" RENAME TO "users";

-- Create NextAuth session table
CREATE TABLE "session" (
  "session_token" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE INDEX "session_userId_idx" ON "session"("user_id");

-- Create NextAuth account table
CREATE TABLE "account" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" timestamp,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "provider_account_id")
);

CREATE INDEX "account_userId_idx" ON "account"("user_id");

-- Create NextAuth verification token table
CREATE TABLE "verification_token" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE INDEX "verification_token_identifier_idx" ON "verification_token"("identifier");
