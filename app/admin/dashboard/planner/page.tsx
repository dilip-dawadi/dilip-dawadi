import type { Metadata } from 'next';
import AdminLayout from '@/components/Admin/AdminLayout';
import FinanceTracker from '@/components/Finance/FinanceTracker';

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description:
    'Advanced income and expense tracker with limits, category analytics, and smart savings alerts.',
};

export default function AdminPlannerPage() {
  return (
    <AdminLayout title="Finance Tracker">
      <FinanceTracker />
    </AdminLayout>
  );
}
