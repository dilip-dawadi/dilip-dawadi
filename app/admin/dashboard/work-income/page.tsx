import type { Metadata } from 'next';
import AdminLayout from '@/components/Admin/AdminLayout';
import CallTrackerPayrollSheet from '@/components/Finance/CallTrackerPayrollSheet';

export const metadata: Metadata = {
  title: 'Call Tracker Payroll',
  description: 'Simple biweekly payroll tracking for hours, rates, and total pay.',
};

export default function AdminWorkIncomePage() {
  return (
    <AdminLayout title="Call Tracker Payroll">
      <CallTrackerPayrollSheet />
    </AdminLayout>
  );
}
