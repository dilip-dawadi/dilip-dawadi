'use client';

import { signIn, useSession } from 'next-auth/react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

type Priority = 'low' | 'medium' | 'high';
type TodoStatus = 'todo' | 'in-progress' | 'done';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TodoStatus;
  remindAt: string | null;
  emailReminder: boolean;
  pushReminder: boolean;
  reminderSentAt: string | null;
}

interface TodoFormState {
  title: string;
  description: string;
  priority: Priority;
  remindAt: string;
  emailReminder: boolean;
  pushReminder: boolean;
}

const statusLabels: Record<TodoStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const defaultFormState: TodoFormState = {
  title: '',
  description: '',
  priority: 'medium',
  remindAt: '',
  emailReminder: true,
  pushReminder: true,
};

function toDateTimeInputValue(dateString: string | null): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
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
      setFeedback('Push notifications are not configured yet. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY.');
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
    setEditingTodoId(todo.id);
    setForm({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      remindAt: toDateTimeInputValue(todo.remindAt),
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

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: 'todo' as TodoStatus,
        remindAt: form.remindAt ? new Date(form.remindAt).toISOString() : undefined,
        emailReminder: form.emailReminder,
        pushReminder: form.pushReminder,
      };

      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save task');
      }

      const created = (await res.json()) as Todo;
      setTodos((current) => [created, ...current]);
      setForm(defaultFormState);
      setFeedback('Task created successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Could not create task.');
    } finally {
      setSaving(false);
    }
  }

  async function updateTodo(todo: Todo, status: TodoStatus) {
    setFeedback('');

    const isEditing = editingTodoId === todo.id;
    const payload = {
      id: todo.id,
      title: isEditing ? form.title.trim() : todo.title,
      description: isEditing ? form.description.trim() : todo.description || '',
      priority: isEditing ? form.priority : todo.priority,
      status,
      remindAt: isEditing
        ? form.remindAt
          ? new Date(form.remindAt).toISOString()
          : undefined
        : todo.remindAt || undefined,
      emailReminder: isEditing ? form.emailReminder : todo.emailReminder,
      pushReminder: isEditing ? form.pushReminder : todo.pushReminder,
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

    if (isEditing) {
      cancelEdit();
      setFeedback('Task updated.');
    }
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
        <button type="button" onClick={() => signIn('google', { callbackUrl: '/todo' })}>
          Sign in with Google
        </button>
      </section>
    );
  }

  return (
    <section className="todo-page">
      <header className="todo-header">
        <div>
          <h1 className="page-title">Priority Planner</h1>
          <p className="page-subtitle">
            Keep your top tasks organized and get reminders by email or browser push.
          </p>
          <p className="todo-user-email">Signed in as {session?.user?.email}</p>
        </div>

        <button type="button" className="todo-push-btn" onClick={enablePushNotifications}>
          {pushEnabled ? 'Push Enabled' : 'Enable Push Alerts'}
        </button>
      </header>

      <form className="todo-form" onSubmit={saveTodo}>
        <div className="todo-form-grid">
          <label htmlFor="todo-title">
            Title
            <input
              id="todo-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Finish landing page"
              maxLength={200}
              required
            />
          </label>

          <label htmlFor="todo-priority">
            Priority
            <select
              id="todo-priority"
              value={form.priority}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  priority: event.target.value as Priority,
                }))
              }
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label htmlFor="todo-remind-at">
            Reminder time
            <input
              id="todo-remind-at"
              type="datetime-local"
              value={form.remindAt}
              onChange={(event) => setForm((prev) => ({ ...prev, remindAt: event.target.value }))}
            />
          </label>
        </div>

        <label htmlFor="todo-description" className="todo-description-field">
          Description
          <textarea
            id="todo-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            placeholder="Add useful details for this task"
            maxLength={2000}
          />
        </label>

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
            {saving ? 'Saving...' : 'Add Task'}
          </button>
          {editingTodoId && (
            <button type="button" onClick={cancelEdit} className="secondary-action">
              Cancel edit
            </button>
          )}
        </div>
      </form>

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
                          <span>{toReadableDate(todo.remindAt)}</span>
                          {todo.reminderSentAt && <span>Reminder sent</span>}
                        </div>

                        <div className="todo-card-actions">
                          <select
                            value={todo.status}
                            onChange={(event) => updateTodo(todo, event.target.value as TodoStatus)}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>

                          {isEditing ? (
                            <button type="button" onClick={() => updateTodo(todo, todo.status)}>
                              Save
                            </button>
                          ) : (
                            <button type="button" onClick={() => startEdit(todo)}>
                              Edit
                            </button>
                          )}

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
