import type { Metadata } from 'next';
import AdminLayout from '@/components/Admin/AdminLayout';
import TodoBoard from '@/components/Todo/TodoBoard';

export const metadata: Metadata = {
  title: 'Planner',
  description: 'Admin life planner with recurring reminders and daily summary notifications.',
};

export default function AdminPlannerPage() {
  return (
    <AdminLayout title="Planner">
      <TodoBoard />
    </AdminLayout>
  );
}
