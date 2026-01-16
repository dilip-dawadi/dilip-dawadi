ALTER TABLE "about_content" DROP CONSTRAINT "about_content_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "about_content" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "blog_posts" DROP COLUMN "author_id";