export interface Project {
  title: string;
  subtitle?: string;
  link?: string;
  image: string;
  date: string;
  desc: string;
  tech?: string[];
  featured?: boolean;
}

const data: Project[] = [
  {
    title: 'Public Service Monitoring Platform',
    subtitle: 'Municipal Service Tracker for Salluit',
    link: 'https://public.salluit.ca',
    image: '/images/projects/salluit-monitor.jpg',
    date: '2025-01-01',
    desc: 'Production-grade web application for municipal service tracking and visibility. Emphasis on reliability, performance, and real-world usability.',
    tech: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    featured: true,
  },
  {
    title: 'E-Commerce Database Architecture',
    subtitle: 'Scalable PostgreSQL Schema Design',
    image: '/images/projects/database-architecture.jpg',
    date: '2024-06-01',
    desc: 'Designed a scalable PostgreSQL schema optimized for performance and secure transactions for an e-commerce platform.',
    tech: ['PostgreSQL', 'Database Design', 'Performance Optimization'],
    featured: true,
  },
  {
    title: 'Cloud-Based Full-Stack Deployment',
    subtitle: 'Automated CI/CD Pipeline',
    image: '/images/projects/cloud-deployment.jpg',
    date: '2024-03-01',
    desc: 'Containerized applications with Docker and automated deployments via Jenkins, reducing release time significantly.',
    tech: ['Docker', 'Jenkins', 'GitHub Actions', 'AWS'],
  },
  {
    title: 'Performance-Optimized React Application',
    subtitle: 'Frontend Optimization Project',
    image: '/images/projects/react-optimization.jpg',
    date: '2023-09-01',
    desc: 'Improved React application performance, achieving a 40% reduction in load time through code splitting, lazy loading, and caching strategies.',
    tech: ['React', 'React Query', 'Performance Optimization', 'Webpack'],
  },
];

export default data;
