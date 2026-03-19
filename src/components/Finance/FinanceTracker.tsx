'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckboxWithLabel } from '@/components/ui/checkbox-with-label';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableSelectWithLabel } from '@/components/ui/searchable-select-with-label';
import { Skeleton } from '@/components/ui/skeleton';
import { TextAreaWithLabel } from '@/components/ui/TextAreaWithLabel';
import { InputWithLabel } from '@/components/ui/input-with-label';
import { DatePickerWithLabel, TimePickerWithLabel } from '@/components/ui/datepicker';

type TransactionType = 'income' | 'expense';

type AlertLevel = 'info' | 'warning' | 'critical';

interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  category: string;
  note: string | null;
  happenedAt: string;
  isRecurring: boolean;
  recurringInterval: 'weekly' | 'monthly' | null;
}

interface FinanceSettings {
  monthlyLimitCents: number;
  dailyLimitCents: number;
  monthlySavingsTargetCents: number;
  notifyThresholdPercent: number;
  smartAlertsEnabled: boolean;
  emailAlertsEnabled: boolean;
  pushAlertsEnabled: boolean;
}

interface FinanceSummary {
  month: string;
  totals: {
    incomeCents: number;
    expenseCents: number;
    netCents: number;
    savingsRatePercent: number;
    transactionCount: number;
  };
  limits: FinanceSettings;
  projectedMonthlyExpenseCents: number;
  byCategory: Array<{ category: string; value: number }>;
  daily: Array<{ date: string; incomeCents: number; expenseCents: number; netCents: number }>;
  alerts: Array<{ level: AlertLevel; message: string }>;
}

interface TransactionFormState {
  type: TransactionType;
  amount: string;
  category: string;
  note: string;
  happenedAtDate: string;
  happenedAtTime: string;
  isRecurring: boolean;
  recurringInterval: 'weekly' | 'monthly';
}

const typeOptions = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
];

const recurringOptions = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const categoryOptions = [
  { id: 'food', label: 'Food & Dining' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'transport', label: 'Transport' },
  { id: 'housing', label: 'Housing' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'health', label: 'Health' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'education', label: 'Education' },
  { id: 'travel', label: 'Travel' },
  { id: 'salary', label: 'Salary' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'investment', label: 'Investment' },
  { id: 'gift', label: 'Gift / Bonus' },
  { id: 'other', label: 'Other' },
];

function createDefaultFormState(): TransactionFormState {
  const now = toLocalDateTimeParts(new Date().toISOString());

  return {
    type: 'expense',
    amount: '',
    category: 'food',
    note: '',
    happenedAtDate: now.date,
    happenedAtTime: now.time,
    isRecurring: false,
    recurringInterval: 'monthly',
  };
}

const defaultSettings: FinanceSettings = {
  monthlyLimitCents: 0,
  dailyLimitCents: 0,
  monthlySavingsTargetCents: 0,
  notifyThresholdPercent: 80,
  smartAlertsEnabled: true,
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
};

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function toAmountCents(rawAmount: string): number {
  const value = Number(rawAmount);
  if (Number.isNaN(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100);
}

function toLocalDateTimeParts(dateString: string): { date: string; time: string } {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' };
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localIso = new Date(date.getTime() - offsetMs).toISOString();

  return {
    date: localIso.slice(0, 10),
    time: localIso.slice(11, 16),
  };
}

function toIsoOrUndefined(date: string, time: string): string | undefined {
  if (!date || !time) {
    return undefined;
  }

  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export default function FinanceTracker() {
  const [month, setMonth] = useState(monthKey());
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [settings, setSettings] = useState<FinanceSettings>(defaultSettings);
  const [settingsDraft, setSettingsDraft] = useState<FinanceSettings>(defaultSettings);
  const [form, setForm] = useState<TransactionFormState>(() => createDefaultFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const setFeedback = (_message: string) => {};
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [lastAlertSent, setLastAlertSent] = useState('');
  const [txToEdit, setTxToEdit] = useState<FinanceTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  const netTone = useMemo(() => {
    if (!summary) return 'neutral';
    if (summary.totals.netCents > 0) return 'positive';
    if (summary.totals.netCents < 0) return 'negative';
    return 'neutral';
  }, [summary]);

  useEffect(() => {
    loadData();
  }, [month]);

  useEffect(() => {
    checkPushSubscription();
  }, []);

  async function loadData() {
    setLoading(true);
    setFeedback('');

    try {
      const [txRes, summaryRes, settingsRes] = await Promise.all([
        fetch(`/api/finance/transactions?month=${encodeURIComponent(month)}`, {
          cache: 'no-store',
        }),
        fetch(`/api/finance/summary?month=${encodeURIComponent(month)}`, { cache: 'no-store' }),
        fetch('/api/finance/settings', { cache: 'no-store' }),
      ]);

      if (!txRes.ok || !summaryRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch finance data');
      }

      const [txData, summaryData, settingsData] = await Promise.all([
        txRes.json(),
        summaryRes.json(),
        settingsRes.json(),
      ]);

      const mergedSettings = {
        ...defaultSettings,
        ...(settingsData as Partial<FinanceSettings>),
      };

      setTransactions(txData as FinanceTransaction[]);
      setSummary(summaryData as FinanceSummary);
      setSettings(mergedSettings);
      setSettingsDraft(mergedSettings);
    } catch (error) {
      console.error(error);
      setFeedback('Unable to load tracker data right now.');
      toast.error('Unable to load tracker data right now.');
    } finally {
      setLoading(false);
    }
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  async function checkPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushEnabled(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const currentSubscription = await registration.pushManager.getSubscription();
      setPushEnabled(Boolean(currentSubscription));
    } catch (error) {
      console.error('Failed to check finance push subscription:', error);
      setPushEnabled(false);
    }
  }

  async function enableFinanceNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setFeedback('This browser does not support notifications.');
      toast.error('This browser does not support notifications.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setFeedback('Push notifications are not supported in this browser.');
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      setNotifyEnabled(false);
      setFeedback('Notification permission was not granted.');
      toast.error('Notification permission was not granted.');
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setNotifyEnabled(true);
      setFeedback('Browser alerts enabled, but push is not configured (missing VAPID key).');
      toast.message('Browser alerts enabled, but push is not configured (missing VAPID key).');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const existing = await registration.pushManager.getSubscription();

      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }));

      const saveRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save push subscription');
      }

      setNotifyEnabled(true);
      setPushEnabled(true);
      setFeedback('Finance notifications enabled (browser + push).');
      toast.success('Finance notifications enabled (browser + push).');
    } catch (error) {
      console.error(error);
      setNotifyEnabled(true);
      setFeedback('Browser alerts enabled, but push subscription failed.');
      toast.error('Browser alerts enabled, but push subscription failed.');
    }
  }

  useEffect(() => {
    if (!notifyEnabled || !summary || summary.alerts.length === 0) {
      return;
    }

    const priority = summary.alerts.find((a) => a.level === 'critical') || summary.alerts[0];
    const alertKey = `${summary.month}:${priority.level}:${priority.message}`;

    if (lastAlertSent === alertKey) {
      return;
    }

    setLastAlertSent(alertKey);
    new Notification('Finance Tracker Alert', {
      body: priority.message,
      tag: `finance-alert-${summary.month}`,
    });
  }, [notifyEnabled, summary, lastAlertSent]);

  function startEdit(tx: FinanceTransaction) {
    const parts = toLocalDateTimeParts(tx.happenedAt);

    setEditingId(tx.id);
    setForm({
      type: tx.type,
      amount: (tx.amountCents / 100).toFixed(2),
      category: tx.category,
      note: tx.note || '',
      happenedAtDate: parts.date,
      happenedAtTime: parts.time,
      isRecurring: tx.isRecurring,
      recurringInterval: tx.recurringInterval || 'monthly',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.message('Editing transaction.');
  }

  function resetForm() {
    setEditingId(null);
    setForm(createDefaultFormState());
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback('');

    const amountCents = toAmountCents(form.amount);
    if (amountCents <= 0) {
      setFeedback('Please add a valid amount.');
      toast.error('Please add a valid amount.');
      setSaving(false);
      return;
    }

    if (!form.happenedAtDate || !form.happenedAtTime) {
      setFeedback('Please select both date and time.');
      toast.error('Please select both date and time.');
      setSaving(false);
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        id: editingId || undefined,
        type: form.type,
        amountCents,
        category: form.category,
        note: form.note,
        happenedAt: toIsoOrUndefined(form.happenedAtDate, form.happenedAtTime),
        isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      };

      const res = await fetch('/api/finance/transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save transaction');
      }

      resetForm();
      setFeedback(editingId ? 'Transaction updated.' : 'Transaction added.');
      toast.success(editingId ? 'Transaction updated.' : 'Transaction added.');
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback('Could not save transaction.');
      toast.error('Could not save transaction.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(id: string) {
    const res = await fetch(`/api/finance/transactions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      setFeedback('Could not delete transaction.');
      toast.error('Could not delete transaction.');
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setFeedback('Transaction deleted.');
    toast.success('Transaction deleted.');
    await loadData();
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');

    const payload = {
      ...settingsDraft,
      monthlyLimitCents: Math.max(0, Math.round(settingsDraft.monthlyLimitCents)),
      dailyLimitCents: Math.max(0, Math.round(settingsDraft.dailyLimitCents)),
      monthlySavingsTargetCents: Math.max(0, Math.round(settingsDraft.monthlySavingsTargetCents)),
      notifyThresholdPercent: Math.min(
        100,
        Math.max(50, Math.round(settingsDraft.notifyThresholdPercent)),
      ),
      emailAlertsEnabled: settingsDraft.emailAlertsEnabled,
      pushAlertsEnabled: settingsDraft.pushAlertsEnabled,
    };

    const res = await fetch('/api/finance/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setFeedback('Could not save limit settings.');
      toast.error('Could not save limit settings.');
      return;
    }

    setSettings(payload);
    setFeedback('Limit settings saved.');
    toast.success('Limit settings saved.');
    await loadData();
  }

  const topAlerts = summary?.alerts.slice(0, 3) || [];
  const isInitialLoading = loading && !summary;

  return (
    <section className="finance-page">
      <header className="finance-header">
        <div>
          <h1 className="page-title">Advanced Tracker</h1>
          <p className="page-subtitle">
            Monthly cashflow intelligence with smart limits, category analytics, and savings nudges.
          </p>
        </div>

        <div className="finance-header-actions">
          <Input
            id="finance-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="finance-month-input"
          />

          <Button
            type="button"
            className="finance-secondary-btn"
            onClick={enableFinanceNotifications}
            variant="outline"
          >
            {pushEnabled ? 'Push Ready' : 'Enable Finance Alerts'}
          </Button>
        </div>
      </header>

      {!isInitialLoading && topAlerts.length > 0 && (
        <div className="finance-alerts">
          {topAlerts.map((alert) => (
            <p
              key={`${alert.level}-${alert.message}`}
              className={`finance-alert finance-alert--${alert.level}`}
            >
              {alert.message}
            </p>
          ))}
        </div>
      )}

      {isInitialLoading && (
        <div className="finance-kpis" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className="finance-kpi" key={`kpi-skeleton-${index}`}>
              <div className="flex flex-col items-start gap-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            </article>
          ))}
        </div>
      )}

      {!isInitialLoading && summary && (
        <div className="finance-kpis">
          <article className="finance-kpi">
            <span>Income</span>
            <strong>{toCurrency(summary.totals.incomeCents)}</strong>
          </article>
          <article className="finance-kpi">
            <span>Expense</span>
            <strong>{toCurrency(summary.totals.expenseCents)}</strong>
          </article>
          <article className={`finance-kpi finance-kpi--${netTone}`}>
            <span>Net</span>
            <strong>{toCurrency(summary.totals.netCents)}</strong>
          </article>
          <article className="finance-kpi">
            <span>Savings Rate</span>
            <strong>{summary.totals.savingsRatePercent}%</strong>
          </article>
        </div>
      )}

      <div className="finance-grid">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
            <CardDescription>Track expense and income with recurring support.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="finance-form finance-form--spacious" onSubmit={saveTransaction}>
              <div className="finance-form-row">
                <div>
                  <SearchableSelectWithLabel
                    fieldTitle="Type"
                    nameInSchema="finance-type"
                    options={typeOptions}
                    value={form.type}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value as TransactionType }))
                    }
                  />
                </div>
                <div>
                  <InputWithLabel
                    fieldTitle="Amount"
                    nameInSchema="finance-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <SearchableSelectWithLabel
                  fieldTitle="Category"
                  nameInSchema="finance-category"
                  options={categoryOptions}
                  value={form.category}
                  onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                  searchable
                />
              </div>

              <div className="finance-form-row">
                <div>
                  <DatePickerWithLabel
                    fieldTitle="Date"
                    id="finance-date"
                    value={form.happenedAtDate}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        happenedAtDate: value,
                      }))
                    }
                  />
                </div>
                <div>
                  <TimePickerWithLabel
                    fieldTitle="Time"
                    id="finance-time"
                    value={form.happenedAtTime}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        happenedAtTime: value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="finance-recurring-row">
                <CheckboxWithLabel
                  id="finance-recurring"
                  className="w-full"
                  label="Recurring"
                  checked={form.isRecurring}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isRecurring: checked,
                    }))
                  }
                />

                {form.isRecurring && (
                  <SearchableSelect
                    options={recurringOptions}
                    value={form.recurringInterval}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        recurringInterval: value as 'weekly' | 'monthly',
                      }))
                    }
                  />
                )}
              </div>

              <div>
                <TextAreaWithLabel
                  fieldTitle="Notes"
                  nameInSchema="finance-note"
                  rows={2}
                  value={form.note}
                  onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Optional context"
                />
              </div>

              <div className="finance-actions">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Transaction' : 'Add Transaction'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    className="finance-secondary-btn"
                    onClick={resetForm}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limits & Smart Alerts</CardTitle>
            <CardDescription>
              Set safety rails to get proactive savings nudges before overspending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="finance-form finance-form--spacious" onSubmit={saveSettings}>
              <div className="finance-form-row">
                <div>
                  <InputWithLabel
                    fieldTitle="Monthly Limit"
                    nameInSchema="monthly-limit"
                    type="number"
                    min={0}
                    step={1}
                    value={(settingsDraft.monthlyLimitCents / 100).toFixed(2)}
                    onChange={(event) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        monthlyLimitCents: Math.round(Number(event.target.value || 0) * 100),
                      }))
                    }
                  />
                </div>
                <div>
                  <InputWithLabel
                    fieldTitle="Daily Limit"
                    nameInSchema="daily-limit"
                    type="number"
                    min={0}
                    step={1}
                    value={(settingsDraft.dailyLimitCents / 100).toFixed(2)}
                    onChange={(event) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        dailyLimitCents: Math.round(Number(event.target.value || 0) * 100),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="finance-form-row">
                <div>
                  <InputWithLabel
                    fieldTitle="Monthly Savings Target"
                    nameInSchema="savings-target"
                    type="number"
                    min={0}
                    step={1}
                    value={(settingsDraft.monthlySavingsTargetCents / 100).toFixed(2)}
                    onChange={(event) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        monthlySavingsTargetCents: Math.round(
                          Number(event.target.value || 0) * 100,
                        ),
                      }))
                    }
                  />
                </div>
                <div>
                  <InputWithLabel
                    fieldTitle="Notify At (%)"
                    nameInSchema="threshold"
                    type="number"
                    min={50}
                    max={100}
                    step={1}
                    value={settingsDraft.notifyThresholdPercent}
                    onChange={(event) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        notifyThresholdPercent: Number(event.target.value || 80),
                      }))
                    }
                  />
                </div>
              </div>

              <CheckboxWithLabel
                id="finance-smart-alerts"
                className="finance-toggle"
                label="Enable smart alerts and save-money recommendations"
                checked={settingsDraft.smartAlertsEnabled}
                onCheckedChange={(checked) =>
                  setSettingsDraft((prev) => ({
                    ...prev,
                    smartAlertsEnabled: checked,
                  }))
                }
              />

              <div className="finance-channel-grid">
                <CheckboxWithLabel
                  id="finance-email-alerts"
                  className="finance-toggle"
                  label="Send finance alerts by email"
                  checked={settingsDraft.emailAlertsEnabled}
                  onCheckedChange={(checked) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      emailAlertsEnabled: checked,
                    }))
                  }
                />

                <CheckboxWithLabel
                  id="finance-push-alerts"
                  className="finance-toggle"
                  label="Send finance alerts by push"
                  checked={settingsDraft.pushAlertsEnabled}
                  onCheckedChange={(checked) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      pushAlertsEnabled: checked,
                    }))
                  }
                />
              </div>

              <div className="finance-actions">
                <Button type="submit">Save Limits</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {!isInitialLoading && (
        <Card className="finance-transactions-card">
          <CardHeader>
            <CardTitle>Recent Transactions ({month})</CardTitle>
            <CardDescription>
              Track every income and expense with edit/delete controls and category-level
              visibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="finance-transaction-list" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, index) => (
                  <article className="finance-transaction" key={`tx-skeleton-${index}`}>
                    <div className="w-full">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-2 h-4 w-64" />
                      <Skeleton className="mt-2 h-4 w-36" />
                    </div>

                    <div className="finance-transaction-side">
                      <Skeleton className="h-5 w-24" />
                      <div className="finance-inline-actions">
                        <Skeleton className="h-7 w-14" />
                        <Skeleton className="h-7 w-14" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="finance-muted">No transactions yet for this month.</p>
            ) : (
              <div className="finance-transaction-list">
                {transactions.map((tx) => (
                  <article
                    key={tx.id}
                    className={`finance-transaction finance-transaction--${tx.type}`}
                  >
                    <div>
                      <h3>
                        {categoryOptions.find((item) => item.id === tx.category)?.label ||
                          tx.category}
                      </h3>
                      <p>{tx.note || 'No notes'}</p>
                      <small>
                        {new Date(tx.happenedAt).toLocaleString()}{' '}
                        {tx.isRecurring ? `• Recurs ${tx.recurringInterval}` : ''}
                      </small>
                    </div>

                    <div className="finance-transaction-side">
                      <strong>
                        {tx.type === 'income' ? '+' : '-'} {toCurrency(tx.amountCents)}
                      </strong>
                      <div className="finance-inline-actions">
                        <Button
                          type="button"
                          className="finance-link-btn admin-btn-edit"
                          onClick={() => setTxToEdit(tx)}
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          className="finance-link-btn finance-link-btn--danger"
                          onClick={() => setTxToDelete(tx.id)}
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isInitialLoading && summary && summary.byCategory.length > 0 && (
        <Card className="finance-transactions-card">
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>
              Projected monthly spend: {toCurrency(summary.projectedMonthlyExpenseCents)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="finance-category-bars">
              {summary.byCategory.map((entry) => {
                const percent = summary.totals.expenseCents
                  ? Math.round((entry.value / summary.totals.expenseCents) * 100)
                  : 0;

                return (
                  <div key={entry.category} className="finance-category-row">
                    <div>
                      <strong>{entry.category}</strong>
                      <span>{toCurrency(entry.value)}</span>
                    </div>
                    <div className="finance-progress">
                      <div style={{ width: `${Math.max(6, percent)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(txToEdit)}
        setOpen={(open) => {
          if (!open) {
            setTxToEdit(null);
          }
        }}
        title="Edit Transaction"
        description="Open this transaction in edit mode?"
        confirmText="Edit"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="default"
        onConfirm={async () => {
          if (!txToEdit) {
            return;
          }

          startEdit(txToEdit);
          setTxToEdit(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(txToDelete)}
        setOpen={(open) => {
          if (!open) {
            setTxToDelete(null);
          }
        }}
        title="Delete Transaction"
        description="Delete this transaction?"
        confirmText="Delete"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!txToDelete) {
            return;
          }

          await deleteTransaction(txToDelete);
          setTxToDelete(null);
        }}
      />
    </section>
  );
}
