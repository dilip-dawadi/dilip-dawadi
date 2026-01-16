import 'dotenv/config';
import { db } from '@/db';
import { aboutContent, projects } from '@/db/schema';
import { aboutMarkdown } from '@/data/about';
import projectsData from '@/data/projects';

async function seed() {
  console.log('Seeding database...');

  try {
    // Seed about content
    console.log('Seeding about content...');
    await db
      .insert(aboutContent)
      .values({
        id: 'default',
        content: aboutMarkdown,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    // Seed projects
    console.log('Seeding projects...');
    for (const project of projectsData) {
      await db
        .insert(projects)
        .values({
          id: `project-${project.title.toLowerCase().replace(/\s+/g, '-')}`,
          title: project.title,
          subtitle: project.subtitle,
          link: project.link,
          image: project.image,
          date: project.date,
          description: project.desc,
          tech: project.tech,
          featured: project.featured,
        })
        .onConflictDoNothing();
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
