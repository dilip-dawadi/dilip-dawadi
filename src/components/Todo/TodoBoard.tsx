'use client';

import { signIn, useSession } from 'next-auth/react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';

type Priority = 'low' | 'medium' | 'high';
type TodoStatus = 'todo' | 'in-progress' | 'done';
type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly' | 'every-n-days';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TodoStatus;
  recurrence: Recurrence;
  repeatEveryDays: number;
  remindAt: string | null;
  emailReminder: boolean;
  pushReminder: boolean;
  reminderSentAt: string | null;
}

interface TodoFormState {
  title: string;
  description: string;
  priority: Priority;
  recurrence: Recurrence;
  repeatEveryDays: number | '';
  remindDate: string;
  remindTime: string;
  emailReminder: boolean;
  pushReminder: boolean;
}

const statusLabels: Record<TodoStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const priorityLabels: Record<Priority, string> = {
  high: 'Urgent',
  medium: 'Important',
  low: 'Normal',
};

const priorityOptions = [
  { id: 'high', label: 'Urgent' },
  { id: 'medium', label: 'Important' },
  { id: 'low', label: 'Normal' },
];

const recurrenceOptions = [
  { id: 'once', label: 'One-time' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'every-n-days', label: 'Every N days' },
];

const statusOptions = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const defaultFormState: TodoFormState = {
  title: '',
  description: '',
  priority: 'medium',
  recurrence: 'once',
  repeatEveryDays: 5,
  remindDate: '',
  remindTime: '',
  emailReminder: true,
  pushReminder: true,
};

function toLocalReminderParts(dateString: string | null): { date: string; time: string } {
  if (!dateString) {
    return { date: '', time: '' };
  }

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

function toReminderIso(remindDate: string, remindTime: string): string | undefined {
  if (!remindDate || !remindTime) {
    return undefined;
  }

  const parsed = new Date(`${remindDate}T${remindTime}`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function toReadableDate(dateString: string | null): string {
  if (!dateString) {
    return 'No reminder';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'No reminder';
  }

  return date.toLocaleString();
}

function scheduleText(todo: Todo): string {
  const base = toReadableDate(todo.remindAt);

  if (!todo.remindAt) {
    return 'No reminder set';
  }

  const remindDate = new Date(todo.remindAt);
  const isOverdue = !Number.isNaN(remindDate.getTime()) && remindDate <= new Date();

  if (isOverdue && todo.status !== 'done') {
    return `Overdue since ${base} (will roll to next schedule after daily reminder run)`;
  }

  if (todo.recurrence === 'daily') {
    return `Daily at ${base}`;
  }

  if (todo.recurrence === 'weekly') {
    return `Weekly, next: ${base}`;
  }

  if (todo.recurrence === 'monthly') {
    return `Monthly, next: ${base}`;
  }

  if (todo.recurrence === 'every-n-days') {
    return `Every ${todo.repeatEveryDays} days, next: ${base}`;
  }

  return `One-time on ${base}`;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function TodoBoard() {
  const { data: session, status } = useSession();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [form, setForm] = useState<TodoFormState>(defaultFormState);
  const [feedback, setFeedback] = useState<string>('');
  const [pushEnabled, setPushEnabled] = useState(false);

  const editingTodo = editingTodoId ? todos.find((todo) => todo.id === editingTodoId) : null;

  const groupedTodos = useMemo(() => {
    return {
      todo: todos.filter((item) => item.status === 'todo'),
      'in-progress': todos.filter((item) => item.status === 'in-progress'),
      done: todos.filter((item) => item.status === 'done'),
    };
  }, [todos]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTodos();
      checkPushSubscription();
    }
  }, [status]);

  async function fetchTodos() {
    setLoading(true);
    setFeedback('');

    try {
      const res = await fetch('/api/todos', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = (await res.json()) as Todo[];
      setTodos(data);
    } catch (error) {
      console.error(error);
      setFeedback('Unable to load tasks right now.');
    } finally {
      setLoading(false);
    }
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
      console.error('Failed to check push subscription:', error);
      setPushEnabled(false);
    }
  }

  async function enablePushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setFeedback('Push notifications are not supported in this browser.');
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setFeedback(
        'Push is not configured. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env and restart the app.',
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setFeedback('Notification permission is required to enable push alerts.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const existing = await registration.pushManager.getSubscription();

      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }));

      const jsonSubscription = subscription.toJSON();
      const saveRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonSubscription),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save push subscription');
      }

      setPushEnabled(true);
      setFeedback('Push notifications enabled. You will receive browser reminders.');
    } catch (error) {
      console.error(error);
      setFeedback('Could not enable push notifications.');
    }
  }

  function startEdit(todo: Todo) {
    const remindParts = toLocalReminderParts(todo.remindAt);

    setEditingTodoId(todo.id);
    setForm({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      recurrence: todo.recurrence,
      repeatEveryDays: todo.repeatEveryDays,
      remindDate: remindParts.date,
      remindTime: remindParts.time,
      emailReminder: todo.emailReminder,
      pushReminder: todo.pushReminder,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingTodoId(null);
    setForm(defaultFormState);
  }

  async function saveTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');

    if (!form.title.trim()) {
      setFeedback('Title is required.');
      return;
    }

    if ((form.remindDate && !form.remindTime) || (!form.remindDate && form.remindTime)) {
      setFeedback('Please select both reminder date and time.');
      return;
    }

    if (form.recurrence !== 'once' && (!form.remindDate || !form.remindTime)) {
      setFeedback('Please set reminder date and time for recurring reminders.');
      return;
    }

    const repeatEveryDays = Number(form.repeatEveryDays);

    if (
      form.recurrence === 'every-n-days' &&
      (!Number.isInteger(repeatEveryDays) || repeatEveryDays < 1 || repeatEveryDays > 365)
    ) {
      setFeedback('Repeat interval must be between 1 and 365 days.');
      return;
    }

    setSaving(true);

    try {
      const method = editingTodo ? 'PUT' : 'POST';
      const remindAtIso = toReminderIso(form.remindDate, form.remindTime);

      const payload = {
        id: editingTodo?.id,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: (editingTodo?.status || 'todo') as TodoStatus,
        recurrence: form.recurrence,
        repeatEveryDays: form.recurrence === 'every-n-days' ? repeatEveryDays : 1,
        remindAt: remindAtIso,
        emailReminder: form.emailReminder,
        pushReminder: form.pushReminder,
      };

      const res = await fetch('/api/todos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save task');
      }

      const saved = (await res.json()) as Todo;

      if (editingTodo) {
        setTodos((current) => current.map((todo) => (todo.id === saved.id ? saved : todo)));
      } else {
        setTodos((current) => [saved, ...current]);
      }

      setForm(defaultFormState);
      setEditingTodoId(null);
      setFeedback(editingTodo ? 'Task updated.' : 'Task created successfully.');
    } catch (error) {
      console.error(error);
      setFeedback(editingTodo ? 'Could not update task.' : 'Could not create task.');
    } finally {
      setSaving(false);
    }
  }

  async function updateTodoStatus(todo: Todo, status: TodoStatus) {
    setFeedback('');

    const payload = {
      id: todo.id,
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status,
      recurrence: todo.recurrence,
      repeatEveryDays: todo.repeatEveryDays,
      remindAt: todo.remindAt || undefined,
      emailReminder: todo.emailReminder,
      pushReminder: todo.pushReminder,
    };

    const res = await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setFeedback('Failed to update task.');
      return;
    }

    const updated = (await res.json()) as Todo;
    setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function deleteTodo(id: string) {
    if (!window.confirm('Delete this task?')) {
      return;
    }

    const res = await fetch(`/api/todos?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      setFeedback('Failed to delete task.');
      return;
    }

    setTodos((current) => current.filter((todo) => todo.id !== id));

    if (editingTodoId === id) {
      cancelEdit();
    }
  }

  if (status === 'loading') {
    return <p className="todo-feedback">Loading your planner...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <section className="todo-auth-card">
        <h2>Sign in required</h2>
        <p>Sign in to create tasks and receive reminder emails or push notifications.</p>
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/admin/dashboard/todo' })}
        >
          Sign in with Google
        </button>
      </section>
    );
  }

  return (
    <section className="todo-page">
      <header className="todo-header hero-life">
        <div>
          <h1 className="page-title">Life Planner</h1>
          <p className="page-subtitle">
            Build habits, track promises, and keep life goals visible with repeating reminders.
          </p>
          <p className="todo-user-email">Signed in as {session?.user?.email}</p>
          <p className="todo-tip">
            Examples: "Ask Sagar for money back", "Evening study routine", "Go for run"
          </p>
          <p className="todo-summary-mode">
            Daily summary mode: due tasks are grouped into one email.
          </p>
        </div>

        <button type="button" className="todo-push-btn" onClick={enablePushNotifications}>
          {pushEnabled ? 'Push Enabled' : 'Enable Push Alerts'}
        </button>
      </header>

      <Card className="todo-form-card">
        <CardHeader>
          <CardTitle>{editingTodo ? 'Edit Task Routine' : 'Create Life Task'}</CardTitle>
          <CardDescription>
            Choose when to remind yourself: one-time, daily, weekly, monthly, or every N days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="todo-form" onSubmit={saveTodo}>
            <div className="todo-form-grid">
              <div>
                <Label htmlFor="todo-title">Task title</Label>
                <Input
                  id="todo-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Ask friend to return money"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <Label htmlFor="todo-priority">Priority level</Label>
                <SearchableSelect
                  id="todo-priority"
                  options={priorityOptions}
                  value={form.priority}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: value as Priority,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Start schedule</Label>
                <div className="todo-reminder-grid">
                  <Input
                    id="todo-remind-date"
                    type="date"
                    value={form.remindDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        remindDate: event.target.value,
                      }))
                    }
                  />
                  <Input
                    id="todo-remind-time"
                    type="time"
                    value={form.remindTime}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        remindTime: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="todo-form-grid todo-form-grid--schedule">
              <div>
                <Label htmlFor="todo-recurrence">Repeat</Label>
                <SearchableSelect
                  id="todo-recurrence"
                  options={recurrenceOptions}
                  value={form.recurrence}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      recurrence: value as Recurrence,
                    }))
                  }
                  searchable
                />
              </div>

              {form.recurrence === 'every-n-days' && (
                <div>
                  <Label htmlFor="todo-repeat-days">Repeat every (days)</Label>
                  <Input
                    id="todo-repeat-days"
                    type="number"
                    min={1}
                    max={365}
                    value={form.repeatEveryDays}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        repeatEveryDays:
                          event.target.value === '' ? '' : Number(event.target.value),
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="todo-description-field">
              <Label htmlFor="todo-description">Details</Label>
              <Textarea
                id="todo-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Why this matters and what success looks like"
                maxLength={2000}
              />
            </div>

            <div className="todo-options-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.emailReminder}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      emailReminder: event.target.checked,
                    }))
                  }
                />
                Email reminder
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.pushReminder}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      pushReminder: event.target.checked,
                    }))
                  }
                />
                Push reminder
              </label>
            </div>

            <div className="todo-form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingTodo ? 'Update Task' : 'Add Task'}
              </button>
              {editingTodo && (
                <button type="button" onClick={cancelEdit} className="secondary-action">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {feedback && <p className="todo-feedback">{feedback}</p>}

      {loading ? (
        <p className="todo-feedback">Loading tasks...</p>
      ) : (
        <div className="todo-columns">
          {(Object.keys(statusLabels) as TodoStatus[]).map((columnStatus) => (
            <section className="todo-column" key={columnStatus}>
              <h2>{statusLabels[columnStatus]}</h2>

              {groupedTodos[columnStatus].length === 0 ? (
                <p className="todo-empty">No tasks here yet.</p>
              ) : (
                <div className="todo-cards">
                  {groupedTodos[columnStatus].map((todo) => {
                    const isEditing = editingTodoId === todo.id;
                    return (
                      <article className={`todo-card priority-${todo.priority}`} key={todo.id}>
                        <header>
                          <h3>{todo.title}</h3>
                          <span className="priority-chip">{priorityLabels[todo.priority]}</span>
                        </header>

                        {todo.description && <p>{todo.description}</p>}

                        <div className="todo-meta">
                          <span>{scheduleText(todo)}</span>
                          {todo.reminderSentAt && <span>Reminder sent</span>}
                        </div>

                        <div className="todo-card-actions">
                          <SearchableSelect
                            options={statusOptions}
                            value={todo.status}
                            onChange={(value) => updateTodoStatus(todo, value as TodoStatus)}
                          />

                          <button type="button" onClick={() => startEdit(todo)}>
                            {isEditing ? 'Editing' : 'Edit'}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTodo(todo.id)}
                            className="danger-action"
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
