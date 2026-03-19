'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';

interface PlannerTodoItem {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

interface WorkLog {
  id: string;
  todoId: string | null;
  workDate: string;
  minutesWorked: number;
  hourlyRateCents: number;
  note: string | null;
}

interface WorkLogFormState {
  todoId: string;
  workDate: string;
  hours: string;
  minutes: string;
  hourlyRate: string;
  note: string;
}

interface TodayWorkSummary {
  date: string;
  totalMinutes: number;
  totalIncomeCents: number;
  entries: number;
}

type ReceivableStatus = 'pending' | 'paid';

interface Receivable {
  id: string;
  todoId: string | null;
  workLogId: string | null;
  payerName: string;
  payerEmail: string | null;
  title: string;
  category: string;
  groupKey: string | null;
  amountCents: number;
  status: ReceivableStatus;
  dueAt: string | null;
  note: string | null;
  minutesWorked: number | null;
  hourlyRateCents: number | null;
  includeWorkDetails: boolean;
  paidAt: string | null;
  incomeTransactionId: string | null;
  lastReminderSentAt: string | null;
}

interface ReceivableFormState {
  todoId: string;
  workLogId: string;
  payerName: string;
  payerEmail: string;
  title: string;
  amount: string;
  dueDate: string;
  note: string;
  includeWorkDetails: boolean;
  useHoursRate: boolean;
  hours: string;
  minutes: string;
  hourlyRate: string;
}

const defaultWorkLogFormState: WorkLogFormState = {
  todoId: '',
  workDate: '',
  hours: '0',
  minutes: '30',
  hourlyRate: '',
  note: '',
};

const DEFAULT_RECEIVABLE_NOTE =
  'Pending amount for this item. Update with your own context (friend, personal work, or general).';

function localDateInputValue(date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function createDefaultWorkLogFormState(): WorkLogFormState {
  return {
    ...defaultWorkLogFormState,
    workDate: localDateInputValue(),
  };
}

function createDefaultReceivableFormState(): ReceivableFormState {
  return {
    todoId: '',
    workLogId: '',
    payerName: '',
    payerEmail: '',
    title: '',
    amount: '',
    dueDate: localDateInputValue(),
    note: DEFAULT_RECEIVABLE_NOTE,
    includeWorkDetails: false,
    useHoursRate: false,
    hours: '0',
    minutes: '30',
    hourlyRate: '',
  };
}

function toDueIsoOrUndefined(date: string): string | undefined {
  if (!date) {
    return undefined;
  }

  // Store with a stable daytime value so date rendering stays consistent across timezones.
  const parsed = new Date(`${date}T09:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function toAmountCents(rawAmount: string): number {
  const value = Number(rawAmount);
  if (Number.isNaN(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100);
}

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

function minutesToHoursLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

type WorkIncomeTab = 'today-income' | 'pending-payment';

const REMINDER_TEMPLATE_STORAGE_KEY = 'work-income:reminder-message-template';
const DEFAULT_REMINDER_TEMPLATE =
  'Hi, this is a friendly reminder to clear the pending amount. Please confirm once sent.';

export default function WorkIncomeCalculator() {
  const [activeTab, setActiveTab] = useState<WorkIncomeTab>('today-income');
  const [month, setMonth] = useState(monthKey());
  const [loading, setLoading] = useState(true);
  const setFeedback = (_message: string) => {};
  const [todos, setTodos] = useState<PlannerTodoItem[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [todayWorkSummary, setTodayWorkSummary] = useState<TodayWorkSummary | null>(null);
  const [workLogForm, setWorkLogForm] = useState<WorkLogFormState>(() =>
    createDefaultWorkLogFormState(),
  );
  const [receivableForm, setReceivableForm] = useState<ReceivableFormState>(() =>
    createDefaultReceivableFormState(),
  );
  const [savingWorkLog, setSavingWorkLog] = useState(false);
  const [savingReceivable, setSavingReceivable] = useState(false);
  const [editingReceivableId, setEditingReceivableId] = useState<string | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderMessageTemplate, setReminderMessageTemplate] = useState(DEFAULT_REMINDER_TEMPLATE);
  const [includeDueDateInReminder, setIncludeDueDateInReminder] = useState(false);
  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const [workLogToDelete, setWorkLogToDelete] = useState<string | null>(null);
  const [receivableToEdit, setReceivableToEdit] = useState<Receivable | null>(null);
  const [receivableToDelete, setReceivableToDelete] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, [month]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedReminderTemplate = window.localStorage.getItem(REMINDER_TEMPLATE_STORAGE_KEY);

    if (savedReminderTemplate) {
      setReminderMessageTemplate(savedReminderTemplate);
    }
  }, []);

  function saveReminderMessageTemplate() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REMINDER_TEMPLATE_STORAGE_KEY, reminderMessageTemplate);
    }

    toast.success('Reminder message template saved.');
  }

  async function loadData() {
    setLoading(true);
    setFeedback('');

    try {
      const [todoRes, workLogsRes, todayWorkRes, receivableRes] = await Promise.all([
        fetch('/api/todos', { cache: 'no-store' }),
        fetch(`/api/finance/work-logs?month=${encodeURIComponent(month)}`, { cache: 'no-store' }),
        fetch('/api/finance/work-logs/today', { cache: 'no-store' }),
        fetch('/api/finance/receivables', { cache: 'no-store' }),
      ]);

      if (!todoRes.ok || !workLogsRes.ok || !todayWorkRes.ok || !receivableRes.ok) {
        throw new Error('Failed to fetch work income data');
      }

      const [todoData, workLogData, todayWorkData, receivableData] = await Promise.all([
        todoRes.json(),
        workLogsRes.json(),
        todayWorkRes.json(),
        receivableRes.json(),
      ]);

      setTodos(todoData as PlannerTodoItem[]);
      setWorkLogs(workLogData as WorkLog[]);
      setTodayWorkSummary(todayWorkData as TodayWorkSummary);
      setReceivables(receivableData as Receivable[]);
    } catch (error) {
      console.error(error);
      setFeedback('Unable to load work income data right now.');
      toast.error('Unable to load work income data right now.');
    } finally {
      setLoading(false);
    }
  }

  async function saveWorkLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingWorkLog(true);
    setFeedback('');

    const hours = Math.max(0, Number(workLogForm.hours || 0));
    const minutes = Math.max(0, Number(workLogForm.minutes || 0));
    const totalMinutes = Math.round(hours * 60 + minutes);
    const hourlyRateCents = Math.round(Number(workLogForm.hourlyRate || 0) * 100);

    if (totalMinutes <= 0) {
      setFeedback('Please add worked hours/minutes.');
      toast.error('Please add worked hours/minutes.');
      setSavingWorkLog(false);
      return;
    }

    if (hourlyRateCents <= 0) {
      setFeedback('Please add a valid hourly rate.');
      toast.error('Please add a valid hourly rate.');
      setSavingWorkLog(false);
      return;
    }

    try {
      const res = await fetch('/api/finance/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todoId: workLogForm.todoId || undefined,
          workDate: workLogForm.workDate ? `${workLogForm.workDate}T09:00` : undefined,
          minutesWorked: totalMinutes,
          hourlyRateCents,
          note: workLogForm.note,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save work log');
      }

      setWorkLogForm((prev) => ({
        ...createDefaultWorkLogFormState(),
        hourlyRate: prev.hourlyRate,
      }));
      setFeedback('Work log added and income synced to finance.');
      toast.success('Work log added and income synced to finance.');
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback('Could not save work log.');
      toast.error('Could not save work log.');
    } finally {
      setSavingWorkLog(false);
    }
  }

  async function deleteWorkLog(id: string) {
    const res = await fetch(`/api/finance/work-logs?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      setFeedback('Could not delete work log.');
      toast.error('Could not delete work log.');
      return;
    }

    setFeedback('Work log removed.');
    toast.success('Work log removed.');
    await loadData();
  }

  async function saveReceivable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingReceivable(true);
    setFeedback('');

    const amountFromInput = toAmountCents(receivableForm.amount);
    const hours = Math.max(0, Number(receivableForm.hours || 0));
    const minutes = Math.max(0, Number(receivableForm.minutes || 0));
    const totalMinutes = Math.round(hours * 60 + minutes);
    const hourlyRateCents = Math.round(Number(receivableForm.hourlyRate || 0) * 100);
    const amountFromHours = Math.round((totalMinutes / 60) * hourlyRateCents);
    const amountCents = receivableForm.useHoursRate ? amountFromHours : amountFromInput;

    if (!receivableForm.payerName.trim()) {
      setFeedback('Payer name is required.');
      toast.error('Payer name is required.');
      setSavingReceivable(false);
      return;
    }

    if (!receivableForm.title.trim()) {
      setFeedback('Receivable title is required.');
      toast.error('Receivable title is required.');
      setSavingReceivable(false);
      return;
    }

    if (amountCents <= 0) {
      setFeedback('Please provide a valid amount.');
      toast.error('Please provide a valid amount.');
      setSavingReceivable(false);
      return;
    }

    if (receivableForm.useHoursRate && (totalMinutes <= 0 || hourlyRateCents <= 0)) {
      setFeedback('Please provide valid hours/minutes and rate for work-based receivable.');
      toast.error('Please provide valid hours/minutes and rate for work-based receivable.');
      setSavingReceivable(false);
      return;
    }

    try {
      const isEditing = Boolean(editingReceivableId);
      const res = await fetch('/api/finance/receivables', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReceivableId || undefined,
          todoId: receivableForm.todoId || undefined,
          workLogId: receivableForm.workLogId || undefined,
          payerName: receivableForm.payerName,
          payerEmail: receivableForm.payerEmail,
          title: receivableForm.title,
          amountCents,
          status: 'pending',
          dueAt: toDueIsoOrUndefined(receivableForm.dueDate),
          note: receivableForm.note,
          minutesWorked: receivableForm.useHoursRate ? totalMinutes : undefined,
          hourlyRateCents: receivableForm.useHoursRate ? hourlyRateCents : undefined,
          includeWorkDetails: receivableForm.includeWorkDetails,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save receivable');
      }

      setEditingReceivableId(null);
      setReceivableForm(createDefaultReceivableFormState());
      setFeedback(isEditing ? 'Pending receivable updated.' : 'Pending receivable added.');
      toast.success(isEditing ? 'Pending receivable updated.' : 'Pending receivable added.');
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback('Could not save receivable.');
      toast.error('Could not save receivable.');
    } finally {
      setSavingReceivable(false);
    }
  }

  function startEditingReceivable(item: Receivable) {
    const amount = (item.amountCents / 100).toFixed(2);
    const dueDate = item.dueAt ? localDateInputValue(new Date(item.dueAt)) : localDateInputValue();
    const totalMinutes = item.minutesWorked || 0;

    setEditingReceivableId(item.id);
    setReceivableForm({
      todoId: item.todoId || '',
      workLogId: item.workLogId || '',
      payerName: item.payerName,
      payerEmail: item.payerEmail || '',
      title: item.title,
      amount,
      dueDate,
      note: item.note || '',
      includeWorkDetails: item.includeWorkDetails,
      useHoursRate: Boolean(item.minutesWorked && item.hourlyRateCents),
      hours: String(Math.floor(totalMinutes / 60)),
      minutes: String(totalMinutes % 60),
      hourlyRate: item.hourlyRateCents ? (item.hourlyRateCents / 100).toFixed(2) : '',
    });
    setActiveTab('pending-payment');
    toast.message('Editing pending receivable.');
  }

  function cancelEditingReceivable() {
    setEditingReceivableId(null);
    setReceivableForm(createDefaultReceivableFormState());
  }

  async function markReceivablesPaid(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    setMarkingPaid(true);
    setFeedback('');

    try {
      const res = await fetch('/api/finance/receivables/bulk-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark paid');
      }

      setSelectedPendingIds([]);
      setFeedback(`${ids.length} receivable(s) marked as paid and synced to finance.`);
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback('Could not update paid status.');
      toast.error('Could not update paid status.');
    } finally {
      setMarkingPaid(false);
    }
  }

  async function sendReminders(ids: string[]) {
    if (ids.length === 0) {
      toast.error('Select at least one pending receivable first.');
      return;
    }

    setSendingReminder(true);
    setFeedback('');

    try {
      const res = await fetch('/api/finance/receivables/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          customMessage: reminderMessage,
          includeDueDate: includeDueDateInReminder,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send reminders');
      }

      const data = (await res.json()) as { sent: number };
      setFeedback(`Reminder email sent to ${data.sent} contact(s).`);
      if (data.sent > 0) {
        toast.success(`Reminder email sent to ${data.sent} contact(s).`);
      } else {
        toast.error('No reminder sent. Selected items may not have payer email.');
      }
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback('Could not send reminder emails.');
      toast.error('Could not send reminder emails.');
    } finally {
      setSendingReminder(false);
    }
  }

  function reminderPreviewText(item: Receivable): string {
    const includeWorkDetails = item.includeWorkDetails;
    const detailsLine =
      includeWorkDetails && item.minutesWorked && item.hourlyRateCents
        ? `\nWork hours: ${(item.minutesWorked / 60).toFixed(2)}h\nRate: ${toCurrency(item.hourlyRateCents)} / hour`
        : '';

    const dueLine =
      includeDueDateInReminder && item.dueAt
        ? `\nDue date: ${new Date(item.dueAt).toLocaleDateString()}`
        : '';
    const customMessage = reminderMessage.trim() ? `\n\n${reminderMessage.trim()}` : '';

    return `Hello ${item.payerName},\n\nThis is a payment reminder for "${item.title}".\nAmount due: ${toCurrency(item.amountCents)}${dueLine}${detailsLine}${customMessage}\n\nPlease let me know once payment is completed.\nThank you.`;
  }

  async function deleteReceivable(id: string) {
    const res = await fetch(`/api/finance/receivables?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      setFeedback('Could not delete receivable.');
      toast.error('Could not delete receivable.');
      return;
    }

    setSelectedPendingIds((current) => current.filter((item) => item !== id));
    setFeedback('Receivable deleted.');
    toast.success('Receivable deleted.');
    await loadData();
  }

  function togglePendingSelection(id: string) {
    setSelectedPendingIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const pendingReceivables = useMemo(
    () => receivables.filter((item) => item.status === 'pending'),
    [receivables],
  );

  const reminderPreviewItems = useMemo(
    () => pendingReceivables.filter((item) => selectedPendingIds.includes(item.id)),
    [pendingReceivables, selectedPendingIds],
  );

  const reminderPreviewEmailItems = useMemo(
    () => reminderPreviewItems.filter((item) => Boolean(item.payerEmail)),
    [reminderPreviewItems],
  );

  const reminderPreviewSkipped = useMemo(
    () => reminderPreviewItems.filter((item) => !item.payerEmail),
    [reminderPreviewItems],
  );

  const paidReceivables = useMemo(
    () => receivables.filter((item) => item.status === 'paid').slice(0, 20),
    [receivables],
  );

  const groupedPendingReceivables = useMemo(() => {
    const grouped = new Map<string, Receivable[]>();

    for (const receivable of pendingReceivables) {
      const key = receivable.payerName;
      const list = grouped.get(key) || [];
      list.push(receivable);
      grouped.set(key, list);
    }

    return Array.from(grouped.entries());
  }, [pendingReceivables]);

  const todoOptions = [
    { id: '', label: 'No linked task' },
    ...todos
      .filter((todo) => todo.status !== 'done')
      .map((todo) => ({ id: todo.id, label: todo.title })),
  ];

  const workLogOptions = [
    { id: '', label: 'No linked work log' },
    ...workLogs.map((log) => ({
      id: log.id,
      label: `${new Date(log.workDate).toLocaleDateString()} - ${minutesToHoursLabel(log.minutesWorked)}`,
    })),
  ];

  return (
    <section className="finance-page">
      <header className="finance-header">
        <div>
          <h1 className="page-title">Today Work Income Calculator</h1>
          <p className="page-subtitle">
            Track your hours and rate, link with planner tasks, and auto-sync income to finance.
          </p>
        </div>

        <div className="finance-header-actions">
          <Input
            id="work-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="finance-month-input"
          />
        </div>
      </header>

      <div className="finance-tabs" role="tablist" aria-label="Work income sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'today-income'}
          className={`finance-tab-btn ${activeTab === 'today-income' ? 'finance-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('today-income')}
        >
          Today Income
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pending-payment'}
          className={`finance-tab-btn ${activeTab === 'pending-payment' ? 'finance-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('pending-payment')}
        >
          Pending Payment
        </button>
      </div>

      {activeTab === 'today-income' ? (
        <>
          <div className="finance-grid finance-grid--single">
            <Card>
              <CardHeader>
                <CardTitle>Add Work Log</CardTitle>
                <CardDescription>
                  Calculate today income from hours and hourly rate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="finance-form" onSubmit={saveWorkLog}>
                  <div className="finance-form-row">
                    <div>
                      <Label htmlFor="work-hours">Hours</Label>
                      <Input
                        id="work-hours"
                        type="number"
                        min={0}
                        step="0.5"
                        value={workLogForm.hours}
                        onChange={(event) =>
                          setWorkLogForm((prev) => ({
                            ...prev,
                            hours: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="work-minutes">Minutes</Label>
                      <Input
                        id="work-minutes"
                        type="number"
                        min={0}
                        max={59}
                        step={1}
                        value={workLogForm.minutes}
                        onChange={(event) =>
                          setWorkLogForm((prev) => ({
                            ...prev,
                            minutes: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="finance-form-row">
                    <div>
                      <Label htmlFor="work-rate">Rate / Hour</Label>
                      <Input
                        id="work-rate"
                        type="number"
                        min={0}
                        step="0.01"
                        value={workLogForm.hourlyRate}
                        onChange={(event) =>
                          setWorkLogForm((prev) => ({
                            ...prev,
                            hourlyRate: event.target.value,
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="work-date">Work Date</Label>
                      <Input
                        id="work-date"
                        type="date"
                        value={workLogForm.workDate}
                        onChange={(event) =>
                          setWorkLogForm((prev) => ({
                            ...prev,
                            workDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="work-linked-todo">Linked Planner Task</Label>
                    <SearchableSelect
                      id="work-linked-todo"
                      options={todoOptions}
                      value={workLogForm.todoId}
                      onChange={(value) => setWorkLogForm((prev) => ({ ...prev, todoId: value }))}
                      searchable
                    />
                  </div>

                  <div>
                    <Label htmlFor="work-note">Work Note</Label>
                    <Textarea
                      id="work-note"
                      rows={2}
                      value={workLogForm.note}
                      onChange={(event) =>
                        setWorkLogForm((prev) => ({
                          ...prev,
                          note: event.target.value,
                        }))
                      }
                      placeholder="What did you work on?"
                    />
                  </div>

                  <div className="finance-work-summary">
                    <span>
                      Today: <strong>{toCurrency(todayWorkSummary?.totalIncomeCents || 0)}</strong>
                    </span>
                    <span>
                      Logged time:{' '}
                      <strong>{minutesToHoursLabel(todayWorkSummary?.totalMinutes || 0)}</strong>
                    </span>
                  </div>

                  <div className="finance-actions">
                    <button type="submit" disabled={savingWorkLog}>
                      {savingWorkLog ? 'Saving...' : 'Add Work Log'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="finance-transactions-card">
            <CardHeader>
              <CardTitle>Work Logs ({month})</CardTitle>
              <CardDescription>
                Work sessions connected to planner tasks and synced as income transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="finance-muted">Loading work logs...</p>
              ) : workLogs.length === 0 ? (
                <p className="finance-muted">No work logs yet this month.</p>
              ) : (
                <div className="finance-transaction-list">
                  {workLogs.map((log) => {
                    const linkedTodo = todos.find((todo) => todo.id === log.todoId);
                    const incomeCents = Math.round((log.minutesWorked / 60) * log.hourlyRateCents);

                    return (
                      <article
                        key={log.id}
                        className="finance-transaction finance-transaction--income"
                      >
                        <div>
                          <h3>{linkedTodo?.title || 'Unlinked work block'}</h3>
                          <p>{log.note || 'No notes'}</p>
                          <small>
                            {new Date(log.workDate).toLocaleDateString()} •{' '}
                            {minutesToHoursLabel(log.minutesWorked)}
                          </small>
                        </div>

                        <div className="finance-transaction-side">
                          <strong>+ {toCurrency(incomeCents)}</strong>
                          <button
                            type="button"
                            className="finance-link-btn finance-link-btn--danger"
                            onClick={() => setWorkLogToDelete(log.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {activeTab === 'pending-payment' ? (
        <Card className="finance-transactions-card">
          <CardHeader>
            <CardTitle>Pending Payments (Receivables)</CardTitle>
            <CardDescription>
              Track unpaid money by person, send reminder emails, and sync to finance once paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="finance-form" onSubmit={saveReceivable}>
              <div className="finance-form-row">
                <div>
                  <Label htmlFor="receivable-payer">Person / Company</Label>
                  <Input
                    id="receivable-payer"
                    value={receivableForm.payerName}
                    onChange={(event) =>
                      setReceivableForm((prev) => ({ ...prev, payerName: event.target.value }))
                    }
                    placeholder="Client name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="receivable-email">Payer Email</Label>
                  <Input
                    id="receivable-email"
                    type="email"
                    value={receivableForm.payerEmail}
                    onChange={(event) =>
                      setReceivableForm((prev) => ({ ...prev, payerEmail: event.target.value }))
                    }
                    placeholder="client@email.com"
                  />
                </div>
              </div>

              <div className="finance-form-row">
                <div>
                  <Label htmlFor="receivable-title">Payment For</Label>
                  <Input
                    id="receivable-title"
                    value={receivableForm.title}
                    onChange={(event) =>
                      setReceivableForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="March dev support"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="receivable-amount">Total Amount</Label>
                  <Input
                    id="receivable-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={receivableForm.amount}
                    disabled={receivableForm.useHoursRate}
                    onChange={(event) =>
                      setReceivableForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <label className="finance-toggle">
                <input
                  type="checkbox"
                  checked={receivableForm.useHoursRate}
                  onChange={(event) =>
                    setReceivableForm((prev) => ({ ...prev, useHoursRate: event.target.checked }))
                  }
                />
                Calculate total from work hours and hourly rate
              </label>

              {receivableForm.useHoursRate && (
                <div className="finance-form-row">
                  <div>
                    <Label htmlFor="receivable-hours">Hours</Label>
                    <Input
                      id="receivable-hours"
                      type="number"
                      min={0}
                      step="0.5"
                      value={receivableForm.hours}
                      onChange={(event) =>
                        setReceivableForm((prev) => ({ ...prev, hours: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="receivable-minutes">Minutes</Label>
                    <Input
                      id="receivable-minutes"
                      type="number"
                      min={0}
                      max={59}
                      step={1}
                      value={receivableForm.minutes}
                      onChange={(event) =>
                        setReceivableForm((prev) => ({ ...prev, minutes: event.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {receivableForm.useHoursRate && (
                <div>
                  <Label htmlFor="receivable-rate">Rate / Hour</Label>
                  <Input
                    id="receivable-rate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={receivableForm.hourlyRate}
                    onChange={(event) =>
                      setReceivableForm((prev) => ({ ...prev, hourlyRate: event.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="finance-form-row">
                <div>
                  <Label htmlFor="receivable-due-date">Due Date</Label>
                  <Input
                    id="receivable-due-date"
                    type="date"
                    value={receivableForm.dueDate}
                    onChange={(event) =>
                      setReceivableForm((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="finance-form-row">
                <div>
                  <Label htmlFor="receivable-todo">Linked Planner Task</Label>
                  <SearchableSelect
                    id="receivable-todo"
                    options={todoOptions}
                    value={receivableForm.todoId}
                    onChange={(value) => setReceivableForm((prev) => ({ ...prev, todoId: value }))}
                    searchable
                  />
                </div>
                <div>
                  <Label htmlFor="receivable-work-log">Linked Work Log</Label>
                  <SearchableSelect
                    id="receivable-work-log"
                    options={workLogOptions}
                    value={receivableForm.workLogId}
                    onChange={(value) =>
                      setReceivableForm((prev) => ({ ...prev, workLogId: value }))
                    }
                    searchable
                  />
                </div>
              </div>

              <label className="finance-toggle">
                <input
                  type="checkbox"
                  checked={receivableForm.includeWorkDetails}
                  onChange={(event) =>
                    setReceivableForm((prev) => ({
                      ...prev,
                      includeWorkDetails: event.target.checked,
                    }))
                  }
                />
                Include work hours and rate details in email reminder
              </label>

              <div>
                <Label htmlFor="receivable-note">Notes</Label>
                <Textarea
                  id="receivable-note"
                  rows={2}
                  value={receivableForm.note}
                  onChange={(event) =>
                    setReceivableForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
              </div>

              <div className="finance-actions">
                <button type="submit" disabled={savingReceivable}>
                  {savingReceivable
                    ? 'Saving...'
                    : editingReceivableId
                      ? 'Update Pending Payment'
                      : 'Add Pending Payment'}
                </button>
                {editingReceivableId ? (
                  <button
                    type="button"
                    className="finance-secondary-btn"
                    onClick={cancelEditingReceivable}
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'pending-payment' ? (
        <Card className="finance-transactions-card">
          <CardHeader>
            <CardTitle>Pending Receivables</CardTitle>
            <CardDescription>
              Grouped by person. Send reminders or mark multiple pending items as paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="finance-form" style={{ marginBottom: '0.8rem' }}>
              <div>
                <Label htmlFor="receivable-reminder-message">Reminder Message (optional)</Label>
                <Textarea
                  id="receivable-reminder-message"
                  rows={2}
                  value={reminderMessage}
                  onChange={(event) => setReminderMessage(event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="receivable-reminder-template">Reminder Message Template</Label>
                <Textarea
                  id="receivable-reminder-template"
                  rows={2}
                  value={reminderMessageTemplate}
                  onChange={(event) => setReminderMessageTemplate(event.target.value)}
                />
                <div className="finance-actions">
                  <button
                    type="button"
                    className="finance-secondary-btn"
                    onClick={() => {
                      setReminderMessage(reminderMessageTemplate);
                      toast.success('Reminder template applied.');
                    }}
                  >
                    Apply Template To Message
                  </button>
                  <button
                    type="button"
                    className="finance-secondary-btn"
                    onClick={saveReminderMessageTemplate}
                  >
                    Save Template
                  </button>
                </div>
              </div>

              <label className="finance-toggle">
                <input
                  type="checkbox"
                  checked={includeDueDateInReminder}
                  onChange={(event) => setIncludeDueDateInReminder(event.target.checked)}
                />
                Include due date in reminder email
              </label>

              <div className="finance-actions">
                <button
                  type="button"
                  className="finance-secondary-btn"
                  disabled={sendingReminder}
                  onClick={() => {
                    if (selectedPendingIds.length === 0) {
                      toast.error('Select at least one pending receivable first.');
                      return;
                    }

                    setShowReminderConfirm(true);
                  }}
                >
                  {sendingReminder ? 'Sending...' : 'Send Email Reminder'}
                </button>
              </div>
            </div>

            {pendingReceivables.length === 0 ? (
              <p className="finance-muted">No pending receivables.</p>
            ) : (
              <div className="finance-transaction-list">
                {groupedPendingReceivables.map(([group, list]) => (
                  <div key={group} className="finance-receivable-group">
                    <div>
                      <strong>{group}</strong>
                      <span>{list.length} pending</span>
                    </div>

                    <div className="finance-transaction-list">
                      {list.map((item) => (
                        <article
                          key={item.id}
                          className="finance-transaction finance-transaction--expense"
                        >
                          <div>
                            <h3>{item.title}</h3>
                            <p>{item.note || 'No notes'}</p>
                            <small>
                              Due:{' '}
                              {item.dueAt
                                ? new Date(item.dueAt).toLocaleDateString()
                                : 'No due date'}
                              {item.payerEmail ? ` • ${item.payerEmail}` : ''}
                            </small>
                          </div>

                          <div className="finance-transaction-side">
                            <label className="finance-toggle">
                              <input
                                type="checkbox"
                                checked={selectedPendingIds.includes(item.id)}
                                onChange={() => togglePendingSelection(item.id)}
                              />
                              Select
                            </label>
                            <strong>+ {toCurrency(item.amountCents)}</strong>
                            <div className="finance-inline-actions">
                              <button
                                type="button"
                                className="finance-link-btn"
                                onClick={() => setReceivableToEdit(item)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="finance-link-btn"
                                onClick={() => void markReceivablesPaid([item.id])}
                              >
                                Mark Paid
                              </button>
                              <button
                                type="button"
                                className="finance-link-btn"
                                onClick={() => void sendReminders([item.id])}
                              >
                                Email
                              </button>
                              <button
                                type="button"
                                className="finance-link-btn finance-link-btn--danger"
                                onClick={() => setReceivableToDelete(item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'pending-payment' ? (
        <Card className="finance-transactions-card">
          <CardHeader>
            <CardTitle>Paid Receivables (Recent)</CardTitle>
            <CardDescription>
              Paid items synced to finance income when status changed to paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paidReceivables.length === 0 ? (
              <p className="finance-muted">No paid receivables yet.</p>
            ) : (
              <div className="finance-transaction-list">
                {paidReceivables.map((item) => (
                  <article
                    key={item.id}
                    className="finance-transaction finance-transaction--income"
                  >
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.payerName}</p>
                      <small>
                        Paid: {item.paidAt ? new Date(item.paidAt).toLocaleString() : 'Unknown'}
                      </small>
                    </div>
                    <div className="finance-transaction-side">
                      <strong>+ {toCurrency(item.amountCents)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={showReminderConfirm}
        setOpen={setShowReminderConfirm}
        title="Confirm Reminder Email"
        description="Review recipients and message preview before sending."
        confirmText={`Send ${reminderPreviewEmailItems.length} Reminder${
          reminderPreviewEmailItems.length === 1 ? '' : 's'
        }`}
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="default"
        isLoading={sendingReminder}
        onConfirm={async () => {
          if (selectedPendingIds.length === 0) {
            toast.error('Select at least one pending receivable first.');
            return;
          }

          if (reminderPreviewEmailItems.length === 0) {
            toast.error('No selected receivable has an email address.');
            return;
          }

          await sendReminders(selectedPendingIds);
          setShowReminderConfirm(false);
        }}
      >
        <div className="finance-form" style={{ gap: '0.75rem' }}>
          <div>
            <strong>Recipients</strong>
            {reminderPreviewEmailItems.length === 0 ? (
              <p className="finance-muted">No selected receivables have payer email.</p>
            ) : (
              <div className="finance-transaction-list" style={{ marginTop: '0.45rem' }}>
                {reminderPreviewEmailItems.map((item) => (
                  <div key={item.id} className="finance-transaction">
                    <div>
                      <h3>{item.payerName}</h3>
                      <small>{item.payerEmail}</small>
                    </div>
                    <div className="finance-transaction-side">
                      <strong>{toCurrency(item.amountCents)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reminderPreviewSkipped.length > 0 ? (
              <p className="finance-muted" style={{ marginTop: '0.45rem' }}>
                Skipped (no email):{' '}
                {reminderPreviewSkipped.map((item) => item.payerName).join(', ')}
              </p>
            ) : null}
          </div>

          {reminderPreviewEmailItems.length > 0 ? (
            <div>
              <strong>Message Preview</strong>
              <div className="finance-transaction-list" style={{ marginTop: '0.45rem' }}>
                {reminderPreviewEmailItems.map((item) => (
                  <div key={`preview-${item.id}`}>
                    <small style={{ color: 'var(--color-fg-light)' }}>
                      To: {item.payerName} ({item.payerEmail})
                    </small>
                    <pre
                      style={{
                        marginTop: '0.35rem',
                        whiteSpace: 'pre-wrap',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        backgroundColor: 'var(--color-bg-alt)',
                        color: 'var(--color-fg)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                      }}
                    >
                      {reminderPreviewText(item)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(workLogToDelete)}
        setOpen={(open) => {
          if (!open) {
            setWorkLogToDelete(null);
          }
        }}
        title="Delete Work Log"
        description="Delete this work log? The linked income entry will also be removed."
        confirmText="Delete"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!workLogToDelete) {
            return;
          }

          await deleteWorkLog(workLogToDelete);
          setWorkLogToDelete(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(receivableToEdit)}
        setOpen={(open) => {
          if (!open) {
            setReceivableToEdit(null);
          }
        }}
        title="Edit Pending Receivable"
        description="Open this receivable in edit mode?"
        confirmText="Edit"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="default"
        onConfirm={async () => {
          if (!receivableToEdit) {
            return;
          }

          startEditingReceivable(receivableToEdit);
          setReceivableToEdit(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(receivableToDelete)}
        setOpen={(open) => {
          if (!open) {
            setReceivableToDelete(null);
          }
        }}
        title="Delete Pending Receivable"
        description="Delete this receivable?"
        confirmText="Delete"
        cancelText="Cancel"
        cancelVariant="outline"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!receivableToDelete) {
            return;
          }

          await deleteReceivable(receivableToDelete);
          setReceivableToDelete(null);
        }}
      />
    </section>
  );
}
