import type { Metadata } from 'next';

import { PersonSchema } from '@/components/Schema';
import Hero from '@/components/Template/Hero';
import PageWrapper from '@/components/Template/PageWrapper';
import { getExperienceText } from '@/lib/experience';

export const metadata: Metadata = {
  description: `Full-Stack Software Developer based in Toronto with ${getExperienceText()} of experience building scalable web applications using React, Node.js, and PostgreSQL.`,
};

export default function HomePage() {
  return (
    <PageWrapper>
      <PersonSchema />
      <Hero />
    </PageWrapper>
  );
}
