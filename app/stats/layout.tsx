import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Me',
  description:
    'Learn more about Dilip Dawadi - Full-Stack Developer specializing in React, Node.js, PostgreSQL. View my tech stack, skills, current focus, and interests.',
  keywords: [
    'Dilip Dawadi',
    'Tech Stack',
    'Skills',
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'React',
    'Node.js',
    'TypeScript',
    'PostgreSQL',
  ],
  openGraph: {
    title: 'About Me - Dilip Dawadi',
    description:
      "Learn more about Dilip Dawadi - my tech stack, skills, and what I'm currently working on.",
  },
  twitter: {
    card: 'summary',
    title: 'About Me - Dilip Dawadi',
    description: 'Learn more about my tech stack, skills, and current focus areas.',
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
