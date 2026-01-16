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
    title: 'Your Project Title',
    subtitle: 'Project Subtitle',
    link: 'https://yourproject.com',
    image: '/images/projects/your-project-image.jpg',
    date: '2025-01-01',
    desc: 'Brief description of your project.',
    tech: ['Tech1', 'Tech2', 'Tech3'],
    featured: true,
  },
  {
    title: 'Your Second Project',
    subtitle: 'Project Subtitle',
    image: '/images/projects/your-second-project-image.jpg',
    date: '2025-01-01',
    desc: 'Brief description of your second project.',
    tech: ['Tech1', 'Tech2', 'Tech3'],
    featured: false,
  },
];

export default data;
