import type { Metadata } from 'next';
import AdminLayout from '@/components/Admin/AdminLayout';
import WorkIncomeCalculator from '@/components/Finance/WorkIncomeCalculator';

export const metadata: Metadata = {
  title: 'Work Income Calculator',
  description:
    'Log worked hours and hourly rates, link with planner tasks, and sync daily income into finance tracking.',
};

export default function AdminWorkIncomePage() {
  return (
    <AdminLayout title="Work Income Calculator">
      <WorkIncomeCalculator />
    </AdminLayout>
  );
}
