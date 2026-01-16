import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function resetDatabase() {
  console.log('🗑️  Dropping old auth tables and fixing foreign keys...');

  try {
    // Drop foreign key constraints from content tables first
    await sql`ALTER TABLE "about_content" DROP CONSTRAINT IF EXISTS "about_content_updated_by_users_id_fk" CASCADE`;
    await sql`ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_author_id_users_id_fk" CASCADE`;

    // Drop old tables
    await sql`DROP TABLE IF EXISTS "verification" CASCADE`;
    await sql`DROP TABLE IF EXISTS "session" CASCADE`;
    await sql`DROP TABLE IF EXISTS "account" CASCADE`;
    await sql`DROP TABLE IF EXISTS "user" CASCADE`;
    await sql`DROP TABLE IF EXISTS "authenticator" CASCADE`;

    // Clear the updated_by column since the user IDs will change
    await sql`UPDATE "about_content" SET "updated_by" = NULL`;
    await sql`UPDATE "blog_posts" SET "author_id" = NULL WHERE "author_id" IS NOT NULL`;

    console.log('✅ Old tables dropped successfully!');
    console.log('✅ Foreign key constraints removed!');
    console.log('');
    console.log('Now run: npx drizzle-kit push');
    console.log('');
    console.log('⚠️  Note: You\'ll need to sign in again and set your user role to "admin"');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetDatabase();
