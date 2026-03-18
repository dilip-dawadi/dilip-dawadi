import type { Metadata } from 'next';
import PageWrapper from '@/components/Template/PageWrapper';
import TodoBoard from '@/components/Todo/TodoBoard';

export const metadata: Metadata = {
  title: 'Priority Planner',
  description: 'Plan tasks by priority, set reminder times, and get notified by email and push.',
};

export default function TodoPage() {
  return (
    <PageWrapper>
      <TodoBoard />
    </PageWrapper>
  );
}
