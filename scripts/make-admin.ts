import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx scripts/make-admin.ts <email>');
    process.exit(1);
  }

  try {
    const result = await sql`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = ${email}
      RETURNING id, email, name, role
    `;

    if (result.length === 0) {
      console.log(`❌ No user found with email: ${email}`);
    } else {
      console.log('✅ User updated successfully!');
      console.log(result[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

makeAdmin();
