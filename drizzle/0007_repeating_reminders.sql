ALTER TABLE "todos" ADD COLUMN "recurrence" text DEFAULT 'once' NOT NULL;
--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "repeat_every_days" integer DEFAULT 1 NOT NULL;
