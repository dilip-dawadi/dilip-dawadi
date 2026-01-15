import type { Metadata } from 'next';

import Education from '@/components/Resume/Education';
import Experience from '@/components/Resume/Experience';
import References from '@/components/Resume/References';
import ResumeNav from '@/components/Resume/ResumeNav';
import Skills from '@/components/Resume/Skills';
import PageWrapper from '@/components/Template/PageWrapper';
import degrees from '@/data/resume/degrees';
import { categories, skills } from '@/data/resume/skills';
import work from '@/data/resume/work';

export const metadata: Metadata = {
  title: 'Resume',
  description:
    "Dilip Dawadi's Resume. Full-Stack Developer with experience in React, Node.js, PostgreSQL, DevOps, and Cloud platforms.",
};

export default function ResumePage() {
  return (
    <PageWrapper>
      <section className="resume-page">
        <header className="resume-header">
          <h1 className="resume-title">Resume</h1>
          <p className="resume-summary">
            Full-Stack Software Developer with 3.5+ years of professional experience building
            scalable web applications. Specializing in React, Node.js, and PostgreSQL with expertise
            in modern DevOps and cloud platforms. Based in Toronto, Canada.
          </p>
        </header>

        <ResumeNav />

        <div className="resume-content">
          <section id="experience" className="resume-section">
            <Experience data={work} />
          </section>

          <section id="education" className="resume-section">
            <Education data={degrees} />
          </section>

          <section id="skills" className="resume-section">
            <Skills skills={skills} categories={categories} />
          </section>

          <section id="projects" className="resume-section">
            <h2 className="resume-section-title">Notable Projects</h2>
            <div className="resume-projects">
              <div className="resume-project-item">
                <h3>Public Service Monitoring Platform</h3>
                <p className="project-period">2025 - Present</p>
                <p>
                  Production-grade web application for municipal service tracking. Deployed with
                  Docker and CI/CD pipelines.
                </p>
                <ul>
                  <li>Built scalable React frontend with TypeScript</li>
                  <li>Designed PostgreSQL database schema for real-time monitoring</li>
                  <li>Implemented automated testing and deployment workflows</li>
                </ul>
              </div>
              <div className="resume-project-item">
                <h3>E-Commerce Database Architecture</h3>
                <p className="project-period">2024</p>
                <p>
                  Designed and optimized PostgreSQL schema for high-traffic e-commerce platform.
                </p>
                <ul>
                  <li>Optimized query performance with indexing strategies</li>
                  <li>Implemented transaction management for secure payments</li>
                  <li>Reduced database response time by 60%</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="references" className="resume-section">
            <References />
          </section>
        </div>
      </section>
    </PageWrapper>
  );
}
