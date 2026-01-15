/**
 * Conforms to https://jsonresume.org/schema/
 */
export interface Position {
  name: string;
  position: string;
  url: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

const work: Position[] = [
  {
    name: 'Freelance Software Developer',
    position: 'Lead Developer',
    url: 'https://public.salluit.ca',
    startDate: '2025-01-01',
    summary: `Lead developer for a live public-facing municipal service monitoring platform used by the Salluit community in Canada.`,
    highlights: [
      'Design, develop, and maintain full-stack web features using React and Node.js for a production municipal platform.',
      'Implement efficient database structures and queries to ensure reliable service data tracking.',
      'Improve application performance, stability, and usability for non-technical end users.',
      'Collaborate remotely with stakeholders to translate operational requirements into technical solutions.',
      'Deliver high-quality, production-ready code under real-world constraints and deadlines.',
    ],
  },
  {
    name: 'DevSign Technology',
    position: 'Full-Stack Software Developer',
    url: 'https://devsign.com.np',
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    summary: `Developed responsive, high-performance web applications and scalable backend services for diverse client projects in Nepal.`,
    highlights: [
      'Built modern web applications using React, JavaScript, and Tailwind CSS with focus on performance and user experience.',
      'Designed and maintained scalable backend services using Node.js and Spring Boot.',
      'Optimized relational databases (PostgreSQL) for performance and data integrity.',
      'Implemented CI/CD pipelines using Docker, Jenkins, and GitHub Actions to streamline deployments and improve release velocity.',
      'Worked in Agile/Scrum teams, contributing to sprint planning, code reviews, and production releases.',
      'Delivered client projects under tight deadlines while maintaining high code quality standards.',
    ],
  },
];

export default work;
