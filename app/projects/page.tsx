import type { Metadata } from 'next';

import Cell from '@/components/Projects/Cell';
import PageWrapper from '@/components/Template/PageWrapper';
import { db } from '@/db';
import { projects } from '@/db/schema';
import data from '@/data/projects';

export const metadata: Metadata = {
  title: 'Archive',
  description:
    'Key projects and achievements from Dilip Dawadi including municipal platforms and cloud deployments.',
};

export const revalidate = 86400; // Revalidate every 24 hours

async function getProjects() {
  try {
    const dbProjects = await db.select().from(projects);

    if (dbProjects.length === 0) {
      return data;
    }

    // Map database projects to match the component's expected format
    return dbProjects.map((p) => ({
      title: p.title,
      subtitle: p.subtitle ?? undefined,
      link: p.link ?? undefined,
      image: p.image,
      date: p.date,
      desc: p.description,
      tech: p.tech ?? undefined,
      featured: p.featured ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return data;
  }
}

export default async function ProjectsPage() {
  const projectsData = await getProjects();
  const featuredProjects = projectsData.filter((p) => p.featured);
  const otherProjects = projectsData.filter((p) => !p.featured);

  return (
    <PageWrapper>
      <section className="projects-page">
        <header className="projects-header">
          <h1 className="page-title">Archive</h1>
          <p className="page-subtitle">Early projects and experiments from my student years</p>
        </header>

        {featuredProjects.length > 0 && (
          <section className="projects-featured">
            <h2 className="projects-section-title">Hackathons &amp; Awards</h2>
            <div className="projects-grid projects-grid--featured">
              {featuredProjects.map((project) => (
                <Cell data={project} key={project.title} />
              ))}
            </div>
          </section>
        )}

        {otherProjects.length > 0 && (
          <section className="projects-other">
            <h2 className="projects-section-title">Side Projects</h2>
            <div className="projects-grid">
              {otherProjects.map((project) => (
                <Cell data={project} key={project.title} />
              ))}
            </div>
          </section>
        )}
      </section>
    </PageWrapper>
  );
}
