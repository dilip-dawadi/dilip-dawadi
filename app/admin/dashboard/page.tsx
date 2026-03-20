'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import { Button } from '@/components/ui/button';

interface FinanceSummaryResponse {
  totals: {
    incomeCents: number;
    expenseCents: number;
    netCents: number;
    savingsRatePercent: number;
  };
}

interface DashboardOverview {
  pendingMoneyCents: number;
  todayWorkIncomeCents: number;
  todayWorkedMinutes: number;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  savingsRatePercent: number;
}

interface TodayWorkResponse {
  totalIncomeCents: number;
  totalMinutes: number;
}

interface DashboardReceivable {
  amountCents: number;
  status: 'pending' | 'paid';
}

const defaultOverview: DashboardOverview = {
  pendingMoneyCents: 0,
  todayWorkIncomeCents: 0,
  todayWorkedMinutes: 0,
  incomeCents: 0,
  expenseCents: 0,
  netCents: 0,
  savingsRatePercent: 0,
};

function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function minutesToHoursLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverview>(defaultOverview);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    void loadOverview();
  }, []);

  async function loadOverview() {
    setOverviewLoading(true);
    setOverviewError('');

    try {
      const month = currentMonthKey();
      const [receivableResult, financeResult, todayWorkResult] = await Promise.allSettled([
        fetch('/api/finance/receivables', { cache: 'no-store' }),
        fetch(`/api/finance/summary?month=${encodeURIComponent(month)}`, { cache: 'no-store' }),
        fetch('/api/finance/work-logs/today', { cache: 'no-store' }),
      ]);

      const nextOverview: DashboardOverview = { ...defaultOverview };
      const failedSources: string[] = [];

      if (receivableResult.status === 'fulfilled' && receivableResult.value.ok) {
        const receivables = (await receivableResult.value.json()) as DashboardReceivable[];
        nextOverview.pendingMoneyCents = receivables
          .filter((item) => item.status === 'pending')
          .reduce((sum, item) => sum + item.amountCents, 0);
      } else {
        failedSources.push('pending payments');
      }

      if (financeResult.status === 'fulfilled' && financeResult.value.ok) {
        const financeSummary = (await financeResult.value.json()) as FinanceSummaryResponse;
        nextOverview.incomeCents = financeSummary.totals.incomeCents;
        nextOverview.expenseCents = financeSummary.totals.expenseCents;
        nextOverview.netCents = financeSummary.totals.netCents;
        nextOverview.savingsRatePercent = financeSummary.totals.savingsRatePercent;
      } else {
        failedSources.push('finance');
      }

      if (todayWorkResult.status === 'fulfilled' && todayWorkResult.value.ok) {
        const todayWork = (await todayWorkResult.value.json()) as TodayWorkResponse;
        nextOverview.todayWorkIncomeCents = todayWork.totalIncomeCents;
        nextOverview.todayWorkedMinutes = todayWork.totalMinutes;
      } else {
        failedSources.push('today work');
      }

      setOverview(nextOverview);

      if (failedSources.length > 0) {
        setOverviewError(`Some overview metrics are unavailable (${failedSources.join(', ')}).`);
      }
    } catch (error) {
      console.error(error);
      setOverviewError('Could not load advanced overview metrics.');
    } finally {
      setOverviewLoading(false);
    }
  }

  const dashboardCards = [
    {
      title: 'About',
      description: 'Manage about section content',
      href: '/admin/dashboard/about',
      icon: '📝',
      color: 'bg-blue-500',
    },
    {
      title: 'Projects',
      description: 'Manage your projects and portfolio',
      href: '/admin/dashboard/projects',
      icon: '💼',
      color: 'bg-green-500',
    },
    {
      title: 'Writing',
      description: 'Manage blog posts and articles',
      href: '/admin/dashboard/writing',
      icon: '✍️',
      color: 'bg-purple-500',
    },
    {
      title: 'Life Planner',
      description: 'Manage daily life tasks and recurring reminders',
      href: '/admin/dashboard/todo',
      icon: '🧭',
      color: 'bg-emerald-500',
    },
    {
      title: 'Finance Tracker',
      description: 'Track income, expenses, limits, and smart savings alerts',
      href: '/admin/dashboard/planner',
      icon: '💸',
      color: 'bg-cyan-500',
    },
    {
      title: 'Work Income',
      description: 'Calculate daily work income from logged hours and hourly rates',
      href: '/admin/dashboard/work-income',
      icon: '🧮',
      color: 'bg-teal-500',
    },
  ];

  return (
    <AdminLayout title="Dashboard" backLink="/admin" showBackButton={false}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-fg-bold)' }}>
          Welcome back!
        </h2>
        <p className="mt-2" style={{ color: 'var(--color-fg-light)' }}>
          Manage your content from the dashboard below.
        </p>
      </div>

      <section
        className="mb-6 rounded-lg p-4"
        style={{
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-alt)',
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-fg-bold)' }}>
            Advanced Overview
          </h3>
          <Button
            type="button"
            onClick={() => void loadOverview()}
            variant="outline"
            className="px-4"
          >
            Refresh
          </Button>
        </div>

        {overviewError ? (
          <p className="text-sm" style={{ color: 'var(--color-fg-light)' }}>
            {overviewError}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overviewLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`overview-skeleton-${index}`}
                className="flex animate-pulse flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <div
                  className="h-4 w-24 rounded"
                  style={{ backgroundColor: 'var(--color-surface-active)' }}
                />
                <div
                  className="h-7 w-24 rounded"
                  style={{ backgroundColor: 'var(--color-surface-active)' }}
                />
                <div
                  className="h-4 w-32 rounded"
                  style={{ backgroundColor: 'var(--color-surface-active)' }}
                />
              </div>
            ))
          ) : (
            <>
              <div
                className="flex flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Today Work Income
                </p>
                <p className="m-0 text-lg leading-tight font-semibold text-emerald-700">
                  {toCurrency(overview.todayWorkIncomeCents)}
                </p>
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  {minutesToHoursLabel(overview.todayWorkedMinutes)} logged today
                </p>
              </div>

              <div
                className="flex flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Pending Money
                </p>
                <p className="m-0 text-lg leading-tight font-semibold text-red-700">
                  {toCurrency(overview.pendingMoneyCents)}
                </p>
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Total unpaid receivables
                </p>
              </div>

              <div
                className="flex flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Monthly Income
                </p>
                <p className="m-0 text-lg leading-tight font-semibold text-green-700">
                  {toCurrency(overview.incomeCents)}
                </p>
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Current month total
                </p>
              </div>

              <div
                className="flex flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Monthly Expense
                </p>
                <p className="m-0 text-lg leading-tight font-semibold text-amber-700">
                  {toCurrency(overview.expenseCents)}
                </p>
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Current month total
                </p>
              </div>

              <div
                className="flex flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Net Cashflow
                </p>
                <p
                  className="m-0 text-lg leading-tight font-semibold"
                  style={{ color: overview.netCents >= 0 ? '#166534' : '#b91c1c' }}
                >
                  {toCurrency(overview.netCents)}
                </p>
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Income minus expenses
                </p>
              </div>

              <div
                className="flex flex-col items-start justify-start gap-1 rounded-md px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Savings Rate
                </p>
                <p
                  className="m-0 text-lg leading-tight font-semibold"
                  style={{ color: 'var(--color-fg-bold)' }}
                >
                  {overview.savingsRatePercent}%
                </p>
                <p className="m-0 text-xs leading-4" style={{ color: 'var(--color-fg-light)' }}>
                  Net as share of income
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-lg p-6 shadow-sm transition-all hover:shadow-lg"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-alt)',
            }}
          >
            <div
              className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${card.color} opacity-10 transition-transform group-hover:scale-150`}
            />
            <div className="relative">
              <div className="mb-3 text-4xl">{card.icon}</div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-fg-bold)' }}>
                {card.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-fg-light)' }}>
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
