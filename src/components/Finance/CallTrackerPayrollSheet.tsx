'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithLabel } from '@/components/ui/datepicker';
import { InputWithLabel } from '@/components/ui/input-with-label';
import { TextAreaWithLabel } from '@/components/ui/TextAreaWithLabel';

interface WorkLog {
  id: string;
  workDate: string;
  minutesWorked: number;
  hourlyRateCents: number;
  note: string | null;
}

interface TodayWorkSummary {
  date: string;
  totalMinutes: number;
  totalIncomeCents: number;
  entries: number;
}

interface PayrollFormState {
  workDate: string;
  hours: string;
  rate: string;
  note: string;
}

interface ReportFormState {
  employerName: string;
  employerEmail: string;
  reportFormat: 'invoice' | 'shift-log' | 'both';
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  serviceDescription: string;
  currencyCode: string;
  taxLabel: string;
  taxAmount: string;
  paymentMethod: string;
  paymentEmail: string;
  paymentDueLabel: string;
  message: string;
}

const DEFAULT_FORM_STATE: PayrollFormState = {
  workDate: '',
  hours: '0',
  rate: '17.6',
  note: '',
};

function localDateInputValue(date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function parseLocalDate(value: string): Date {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatLocalDate(date: Date): string {
  return date.toLocaleDateString();
}

function formatStoredDate(value: string): string {
  const datePart = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? formatLocalDate(parseLocalDate(datePart)) : value;
}

function startOfBiweeklyPeriod(date: Date): string {
  const periodStart = new Date(date);
  const dayOfWeek = periodStart.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  periodStart.setDate(periodStart.getDate() - daysSinceMonday);
  return localDateInputValue(periodStart);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function hoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(2)}h`;
}

function rowTotalCents(minutesWorked: number, hourlyRateCents: number): number {
  return Math.round((minutesWorked / 60) * hourlyRateCents);
}

// STANDARD BIWEEKLY PERIOD HELPERS
function getFirstMondayOnOrAfter(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const daysToAdd = (8 - day) % 7; // days until next Monday (0 if already Monday)
  d.setDate(d.getDate() + daysToAdd);
  return d;
}

function generateBiweeklyPeriodsForYear(year: number, anchorDate?: Date) {
  const periods: { start: string; end: string; index: number }[] = [];
  const startAnchor = anchorDate || getFirstMondayOnOrAfter(new Date(year, 0, 1));
  const periodStart = new Date(startAnchor);

  let idx = 1;
  const lastDay = new Date(year, 11, 31);

  while (periodStart <= lastDay) {
    const start = new Date(periodStart);
    const end = addDays(start, 13);
    periods.push({ start: localDateInputValue(start), end: localDateInputValue(end), index: idx });
    periodStart.setDate(periodStart.getDate() + 14);
    idx += 1;
  }

  return periods;
}

function snapDateToStandardPeriodStart(date: Date, periods: { start: string; end: string }[]) {
  for (const p of periods) {
    const s = parseLocalDate(p.start);
    const e = parseLocalDate(p.end);
    if (date >= s && date <= e) return p.start;
  }

  // if not found, snap to the closest previous period start
  const sorted = periods.slice().sort((a, b) => (a.start < b.start ? -1 : 1));
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (parseLocalDate(sorted[i].start) < date) return sorted[i].start;
  }

  return periods[0]?.start || localDateInputValue();
}

function createDefaultFormState(): PayrollFormState {
  return {
    ...DEFAULT_FORM_STATE,
    workDate: localDateInputValue(),
  };
}

function createDefaultReportFormState(): ReportFormState {
  const year = new Date().getFullYear();

  return {
    employerName: 'Vincenzo Commisso',
    employerEmail: 'commisso1@gmail.com',
    reportFormat: 'both',
    invoiceNumber: `INV-${year}-001`,
    invoiceDate: localDateInputValue(),
    clientName: 'V.C. Design Inc.',
    serviceDescription: 'Cabinet Installation Helper Services',
    currencyCode: 'CAD',
    taxLabel: 'HST/GST',
    taxAmount: '0',
    paymentMethod: 'E-Transfer',
    paymentEmail: 'dilipdawadi0@gmail.com',
    paymentDueLabel: 'Upon Receipt',
    message: 'Please review my biweekly contractor shift log and confirm receipt.',
  };
}

export default function CallTrackerPayrollSheet() {
  const [periodStart, setPeriodStart] = useState(() => startOfBiweeklyPeriod(new Date()));
  const [periodEnd, setPeriodEnd] = useState(() => {
    const startDate = parseLocalDate(startOfBiweeklyPeriod(new Date()));
    return localDateInputValue(addDays(startDate, 13));
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [entries, setEntries] = useState<WorkLog[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodayWorkSummary | null>(null);
  const [form, setForm] = useState<PayrollFormState>(() => createDefaultFormState());
  const [reportForm, setReportForm] = useState<ReportFormState>(() =>
    createDefaultReportFormState(),
  );
  const [sendingReport, setSendingReport] = useState(false);

  // Standard biweekly period controls
  const [useStandardPeriods, setUseStandardPeriods] = useState(true);
  const [periodYear, setPeriodYear] = useState(() => new Date().getFullYear());
  const periods = useMemo(() => generateBiweeklyPeriodsForYear(periodYear), [periodYear]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);

  useEffect(() => {
    if (!useStandardPeriods || periods.length === 0) return;

    const matchIdx = periods.findIndex((p) => p.start === periodStart);
    if (matchIdx !== -1) {
      setSelectedPeriodIndex(matchIdx);
      return;
    }

    const snapped = snapDateToStandardPeriodStart(parseLocalDate(periodStart), periods);
    setPeriodStart(snapped);
    const p = periods.find((pp) => pp.start === snapped);
    if (p) setPeriodEnd(p.end);
    const newIdx = periods.findIndex((pp) => pp.start === snapped);
    setSelectedPeriodIndex(newIdx !== -1 ? newIdx : 0);
  }, [useStandardPeriods, periods]);

  useEffect(() => {
    if (!useStandardPeriods) return;
    const p = periods[selectedPeriodIndex];
    if (p) {
      setPeriodStart(p.start);
      setPeriodEnd(p.end);
    }
  }, [selectedPeriodIndex, useStandardPeriods, periods]);

  // ensure the add-row date stays inside the active period
  useEffect(() => {
    const entryDate = parseLocalDate(form.workDate);
    const start = parseLocalDate(periodStart);
    const end = parseLocalDate(periodEnd);

    if (!form.workDate || entryDate < start || entryDate > end) {
      setForm((prev) => ({ ...prev, workDate: periodStart }));
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    void loadData();
  }, [periodStart, periodEnd]);

  async function loadData() {
    setLoading(true);

    try {
      const [logsResult, todayResult] = await Promise.all([
        fetch(
          `/api/finance/work-logs?start=${encodeURIComponent(periodStart)}&end=${encodeURIComponent(periodEnd)}`,
          { cache: 'no-store' },
        ),
        fetch('/api/finance/work-logs/today', { cache: 'no-store' }),
      ]);

      if (!logsResult.ok || !todayResult.ok) {
        throw new Error('Failed to load payroll sheet data');
      }

      const [logsData, todayData] = await Promise.all([logsResult.json(), todayResult.json()]);

      setEntries(logsData as WorkLog[]);
      setTodaySummary(todayData as TodayWorkSummary);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load the payroll sheet right now.');
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    return entries.reduce(
      (accumulator, entry) => {
        accumulator.minutes += entry.minutesWorked;
        accumulator.incomeCents += rowTotalCents(entry.minutesWorked, entry.hourlyRateCents);
        accumulator.entries += 1;
        return accumulator;
      },
      { minutes: 0, incomeCents: 0, entries: 0 },
    );
  }, [entries]);

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hours = Number(form.hours);
    const rate = Number(form.rate);

    if (!hours || hours <= 0) {
      toast.error('Enter worked hours before saving.');
      return;
    }

    if (!rate || rate <= 0) {
      toast.error('Enter an hourly rate before saving.');
      return;
    }

    // enforce selected period bounds
    const entryDate = parseLocalDate(form.workDate);
    const start = parseLocalDate(periodStart);
    const end = parseLocalDate(periodEnd);
    if (entryDate < start || entryDate > end) {
      toast.error('Entry date must be inside the selected biweekly period.');
      setSaving(false);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/finance/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workDate: form.workDate,
          minutesWorked: Math.round(hours * 60),
          hourlyRateCents: Math.round(rate * 100),
          note: form.note.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payroll entry');
      }

      toast.success('Payroll entry saved.');
      setForm((previous) => ({
        ...createDefaultFormState(),
        workDate: previous.workDate,
        rate: previous.rate,
      }));
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Unable to save payroll entry.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm('Delete this payroll row?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/finance/work-logs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payroll entry');
      }

      toast.success('Payroll row deleted.');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Unable to delete payroll row.');
    } finally {
      setDeletingId(null);
    }
  }

  async function sendReportToEmployer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reportForm.employerEmail.trim()) {
      toast.error('Add employer email before sending logs.');
      return;
    }

    if (entries.length === 0) {
      toast.error('Add at least one shift before sending logs.');
      return;
    }

    setSendingReport(true);

    try {
      const taxAmountCents = Math.max(
        0,
        Math.round((Number(reportForm.taxAmount || 0) || 0) * 100),
      );

      const response = await fetch('/api/finance/work-logs/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerName: reportForm.employerName.trim(),
          employerEmail: reportForm.employerEmail.trim(),
          reportFormat: reportForm.reportFormat,
          invoiceNumber: reportForm.invoiceNumber.trim(),
          invoiceDate: reportForm.invoiceDate,
          clientName: reportForm.clientName.trim(),
          serviceDescription: reportForm.serviceDescription.trim(),
          currencyCode: reportForm.currencyCode.trim() || 'CAD',
          taxLabel: reportForm.taxLabel.trim() || 'Tax',
          taxAmountCents,
          paymentMethod: reportForm.paymentMethod.trim(),
          paymentEmail: reportForm.paymentEmail.trim(),
          paymentDueLabel: reportForm.paymentDueLabel.trim(),
          periodStart,
          periodEnd,
          message: reportForm.message.trim(),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send report');
      }

      toast.success('Biweekly shift log sent to employer.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send shift log right now.';
      toast.error(message);
    } finally {
      setSendingReport(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-[1.35rem]">Call Tracker Payroll</CardTitle>
          <CardDescription>
            Simple spreadsheet-style payroll tracking. Total pay is calculated as hours × rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-(--color-border) bg-bg px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-fg-light">Hours this period</p>
              <p className="mt-1 text-xl font-semibold text-(--color-fg-bold)">
                {hoursLabel(totals.minutes)}
              </p>
            </div>
            <div className="rounded-md border border-(--color-border) bg-bg px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-fg-light">Period pay</p>
              <p className="mt-1 text-xl font-semibold text-emerald-700">
                {toCurrency(totals.incomeCents)}
              </p>
            </div>
            <div className="rounded-md border border-(--color-border) bg-bg px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-fg-light">Rows</p>
              <p className="mt-1 text-xl font-semibold text-(--color-fg-bold)">{totals.entries}</p>
            </div>
            <div className="rounded-md border border-(--color-border) bg-bg px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-fg-light">Today</p>
              <p className="mt-1 text-xl font-semibold text-(--color-fg-bold)">
                {todaySummary ? hoursLabel(todaySummary.totalMinutes) : '0.00h'}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-(--color-border) bg-bg-alt px-4 py-3 text-sm text-fg-light">
            <span className="font-semibold text-fg">Biweekly period:</span>{' '}
            {formatLocalDate(parseLocalDate(periodStart))} to{' '}
            {formatLocalDate(parseLocalDate(periodEnd))}
          </div>

          <div className="overflow-x-auto rounded-md border border-(--color-border) bg-bg">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg-alt text-left text-xs uppercase tracking-[0.18em] text-fg-light">
                  <th className="border-b border-(--color-border) px-4 py-3">Date</th>
                  <th className="border-b border-(--color-border) px-4 py-3">Hours</th>
                  <th className="border-b border-(--color-border) px-4 py-3">Rate</th>
                  <th className="border-b border-(--color-border) px-4 py-3">Total</th>
                  <th className="border-b border-(--color-border) px-4 py-3">Notes</th>
                  <th className="border-b border-(--color-border) px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-fg-light" colSpan={6}>
                      Loading payroll rows...
                    </td>
                  </tr>
                ) : entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-(--color-border) last:border-b-0">
                      <td className="px-4 py-3">{formatStoredDate(entry.workDate)}</td>
                      <td className="px-4 py-3">{(entry.minutesWorked / 60).toFixed(2)}</td>
                      <td className="px-4 py-3">{toCurrency(entry.hourlyRateCents)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {toCurrency(rowTotalCents(entry.minutesWorked, entry.hourlyRateCents))}
                      </td>
                      <td className="px-4 py-3 text-fg-light">{entry.note || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === entry.id}
                          onClick={() => void deleteEntry(entry.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-fg-light" colSpan={6}>
                      No payroll rows yet. Add one on the right.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-(--color-border) bg-bg-alt font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{hoursLabel(totals.minutes)}</td>
                  <td className="px-4 py-3">Formula</td>
                  <td className="px-4 py-3 text-emerald-700">{toCurrency(totals.incomeCents)}</td>
                  <td className="px-4 py-3 text-fg-light" colSpan={2}>
                    Hours × rate
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[1.15rem]">Formula</CardTitle>
          </CardHeader>
          <CardContent className="-mt-4 space-y-2 text-sm text-fg-light">
            <p>Row total = hours × hourly rate</p>
            <p>Period total = sum of all row totals</p>
            <p>
              Current period: {periodStart} to {periodEnd}
            </p>
            <div className="pt-2">
              <div className="space-y-3">
                {/* <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useStandardPeriods}
                    onChange={(e) => setUseStandardPeriods(e.target.checked)}
                  />
                  <span className="pl-1">Use standard biweekly periods</span>
                </label> */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    className="rounded-xs bg-white border px-2 py-1 text-sm w-full"
                  >
                    <option value={periodYear - 1}>{periodYear - 1}</option>
                    <option value={periodYear}>{periodYear}</option>
                    <option value={periodYear + 1}>{periodYear + 1}</option>
                  </select>

                  <select
                    value={selectedPeriodIndex}
                    onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
                    className="rounded-xs bg-white border px-2 py-1 text-sm w-full"
                  >
                    {periods.map((p, idx) => (
                      <option key={p.start} value={idx}>
                        {`#${p.index} — ${p.start}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* <div className="pt-2">
              <InputWithLabel
                id="payroll-period-start"
                nameInSchema="payroll-period-start"
                fieldTitle="Period Start"
                type="date"
                value={periodStart}
                disabled={useStandardPeriods}
                onChange={(event) => {
                  const nextStart = event.target.value || startOfBiweeklyPeriod(new Date());
                  setPeriodStart(nextStart);

                  if (parseLocalDate(periodEnd) < parseLocalDate(nextStart)) {
                    setPeriodEnd(localDateInputValue(addDays(parseLocalDate(nextStart), 13)));
                  }
                }}
              />
            </div>
            <div className="pt-2">
              <InputWithLabel
                id="payroll-period-end"
                nameInSchema="payroll-period-end"
                fieldTitle="Period End"
                type="date"
                value={periodEnd}
                min={periodStart}
                disabled={useStandardPeriods}
                onChange={(event) => {
                  const nextEnd =
                    event.target.value ||
                    localDateInputValue(addDays(parseLocalDate(periodStart), 13));
                  setPeriodEnd(nextEnd);
                }}
              />
            </div> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[1.15rem]">Add row</CardTitle>
            <CardDescription>
              Enter one work day at a time and the totals update automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveEntry}>
              <DatePickerWithLabel
                id="payroll-date"
                fieldTitle="Date"
                value={form.workDate}
                min={periodStart}
                max={periodEnd}
                onChange={(value) => setForm((previous) => ({ ...previous, workDate: value }))}
                onInvalidSelect={() =>
                  toast.error('Select a date inside the active biweekly period.')
                }
              />

              <InputWithLabel
                id="payroll-hours"
                nameInSchema="payroll-hours"
                fieldTitle="Hours"
                type="number"
                step="0.25"
                min="0"
                placeholder="0.00"
                value={form.hours}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, hours: event.target.value }))
                }
              />

              <InputWithLabel
                id="payroll-rate"
                nameInSchema="payroll-rate"
                fieldTitle="Hourly Rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="25.00"
                value={form.rate}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, rate: event.target.value }))
                }
              />

              <TextAreaWithLabel
                id="payroll-note"
                nameInSchema="payroll-note"
                fieldTitle="Notes"
                rows={4}
                placeholder="Optional call or payroll note"
                value={form.note}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, note: event.target.value }))
                }
              />

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save row'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* duplicate Formula card removed */}

        <Card>
          <CardHeader>
            <CardTitle className="text-[1.15rem]">Send Biweekly Log</CardTitle>
            <CardDescription>
              Contractor workflow: send this period's shift details to the employer email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={sendReportToEmployer}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative w-full">
                  <label
                    htmlFor="report-format"
                    className="absolute left-3 top-[-0.55rem] z-10 bg-bg-alt px-1 text-xs font-medium tracking-wider"
                    style={{ color: 'var(--color-fg-light)' }}
                  >
                    Send Format
                  </label>
                  <select
                    id="report-format"
                    className="flex h-12 w-full rounded-xs border border-(--color-border) bg-bg px-3 py-2 text-sm text-(--color-fg)"
                    value={reportForm.reportFormat}
                    onChange={(event) =>
                      setReportForm((previous) => ({
                        ...previous,
                        reportFormat: event.target.value as ReportFormState['reportFormat'],
                      }))
                    }
                  >
                    <option value="both">Invoice + Biweekly Shift Log</option>
                    <option value="invoice">Invoice Only</option>
                    <option value="shift-log">Shift Log Only</option>
                  </select>
                </div>

                <InputWithLabel
                  id="invoice-number"
                  nameInSchema="invoice-number"
                  fieldTitle="Invoice #"
                  type="text"
                  placeholder="INV-2026-001"
                  value={reportForm.invoiceNumber}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      invoiceNumber: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputWithLabel
                  id="invoice-date"
                  nameInSchema="invoice-date"
                  fieldTitle="Invoice Date"
                  type="date"
                  value={reportForm.invoiceDate}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, invoiceDate: event.target.value }))
                  }
                />

                <InputWithLabel
                  id="client-name"
                  nameInSchema="client-name"
                  fieldTitle="Client Name"
                  type="text"
                  placeholder="Company Name"
                  value={reportForm.clientName}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, clientName: event.target.value }))
                  }
                />
              </div>

              <InputWithLabel
                id="employer-name"
                nameInSchema="employer-name"
                fieldTitle="Employer Name"
                type="text"
                placeholder="Employer or manager"
                value={reportForm.employerName}
                onChange={(event) =>
                  setReportForm((previous) => ({ ...previous, employerName: event.target.value }))
                }
              />

              <InputWithLabel
                id="employer-email"
                nameInSchema="employer-email"
                fieldTitle="Employer Email"
                type="email"
                placeholder="name@company.com"
                value={reportForm.employerEmail}
                onChange={(event) =>
                  setReportForm((previous) => ({ ...previous, employerEmail: event.target.value }))
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputWithLabel
                  id="service-description"
                  nameInSchema="service-description"
                  fieldTitle="Service Description"
                  type="text"
                  placeholder="Cabinet Installer Helper Services"
                  value={reportForm.serviceDescription}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      serviceDescription: event.target.value,
                    }))
                  }
                />

                <InputWithLabel
                  id="currency-code"
                  nameInSchema="currency-code"
                  fieldTitle="Currency"
                  type="text"
                  placeholder="CAD"
                  value={reportForm.currencyCode}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      currencyCode: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputWithLabel
                  id="tax-label"
                  nameInSchema="tax-label"
                  fieldTitle="Tax Label"
                  type="text"
                  placeholder="HST/GST"
                  value={reportForm.taxLabel}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, taxLabel: event.target.value }))
                  }
                />

                <InputWithLabel
                  id="tax-amount"
                  nameInSchema="tax-amount"
                  fieldTitle="Tax Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={reportForm.taxAmount}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, taxAmount: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputWithLabel
                  id="payment-method"
                  nameInSchema="payment-method"
                  fieldTitle="Payment Method"
                  type="text"
                  placeholder="E-Transfer"
                  value={reportForm.paymentMethod}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      paymentMethod: event.target.value,
                    }))
                  }
                />

                <InputWithLabel
                  id="payment-email"
                  nameInSchema="payment-email"
                  fieldTitle="Payment Email"
                  type="email"
                  placeholder="you@example.com"
                  value={reportForm.paymentEmail}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, paymentEmail: event.target.value }))
                  }
                />
              </div>

              <InputWithLabel
                id="payment-due"
                nameInSchema="payment-due"
                fieldTitle="Payment Due"
                type="text"
                placeholder="Upon Receipt"
                value={reportForm.paymentDueLabel}
                onChange={(event) =>
                  setReportForm((previous) => ({
                    ...previous,
                    paymentDueLabel: event.target.value,
                  }))
                }
              />

              <TextAreaWithLabel
                id="report-message"
                nameInSchema="report-message"
                fieldTitle="Message"
                rows={4}
                placeholder="Optional context for the employer"
                value={reportForm.message}
                onChange={(event) =>
                  setReportForm((previous) => ({ ...previous, message: event.target.value }))
                }
              />

              <Button
                type="submit"
                className="w-full"
                disabled={sendingReport || entries.length === 0}
              >
                {sendingReport ? 'Sending log...' : 'Send period log to employer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
