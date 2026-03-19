import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name'),
    role: text('role').notNull().default('user'),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
  },
  (table) => [index('idx_users_email').on(table.email)],
);

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const authenticators = pgTable(
  'authenticator',
  {
    credentialID: text('credentialID').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
  },
  (authenticator) => [
    primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  ],
);

// Content Management Tables
export const aboutContent = pgTable('about_content', {
  id: text('id').primaryKey().default('default'),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by').references(() => users.id, {
    onDelete: 'cascade',
  }),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  link: text('link'),
  image: text('image').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  tech: jsonb('tech').$type<string[]>(),
  featured: boolean('featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const blogPosts = pgTable('blog_posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  published: boolean('published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  authorId: text('author_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
});

export const todos = pgTable(
  'todos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    priority: text('priority').notNull().default('medium'),
    status: text('status').notNull().default('todo'),
    recurrence: text('recurrence').notNull().default('once'),
    repeatEveryDays: integer('repeat_every_days').notNull().default(1),
    remindAt: timestamp('remind_at', { mode: 'date' }),
    emailReminder: boolean('email_reminder').notNull().default(true),
    pushReminder: boolean('push_reminder').notNull().default(true),
    reminderSentAt: timestamp('reminder_sent_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_todos_user').on(table.userId),
    index('idx_todos_remind_at').on(table.remindAt),
  ],
);

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    keys: jsonb('keys').$type<{ p256dh: string; auth: string }>().notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('idx_push_user').on(table.userId)],
);

export const financeTransactions = pgTable(
  'finance_transactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull().default('expense'),
    amountCents: integer('amount_cents').notNull(),
    category: text('category').notNull(),
    note: text('note'),
    happenedAt: timestamp('happened_at', { mode: 'date' }).notNull(),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurringInterval: text('recurring_interval'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_finance_transactions_user').on(table.userId),
    index('idx_finance_transactions_happened_at').on(table.happenedAt),
    index('idx_finance_transactions_type').on(table.type),
  ],
);

export const financeSettings = pgTable(
  'finance_settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    monthlyLimitCents: integer('monthly_limit_cents').notNull().default(0),
    dailyLimitCents: integer('daily_limit_cents').notNull().default(0),
    monthlySavingsTargetCents: integer('monthly_savings_target_cents').notNull().default(0),
    notifyThresholdPercent: integer('notify_threshold_percent').notNull().default(80),
    smartAlertsEnabled: boolean('smart_alerts_enabled').notNull().default(true),
    emailAlertsEnabled: boolean('email_alerts_enabled').notNull().default(true),
    pushAlertsEnabled: boolean('push_alerts_enabled').notNull().default(true),
    lastAlertSentAt: timestamp('last_alert_sent_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('idx_finance_settings_user').on(table.userId)],
);

export const financeWorkLogs = pgTable(
  'finance_work_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    todoId: text('todo_id').references(() => todos.id, { onDelete: 'set null' }),
    workDate: timestamp('work_date', { mode: 'date' }).notNull(),
    minutesWorked: integer('minutes_worked').notNull(),
    hourlyRateCents: integer('hourly_rate_cents').notNull(),
    note: text('note'),
    incomeTransactionId: text('income_transaction_id').references(() => financeTransactions.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_finance_work_logs_user').on(table.userId),
    index('idx_finance_work_logs_work_date').on(table.workDate),
    index('idx_finance_work_logs_todo').on(table.todoId),
  ],
);

export const financeReceivables = pgTable(
  'finance_receivables',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    todoId: text('todo_id').references(() => todos.id, { onDelete: 'set null' }),
    workLogId: text('work_log_id').references(() => financeWorkLogs.id, { onDelete: 'set null' }),
    payerName: text('payer_name').notNull(),
    payerEmail: text('payer_email'),
    title: text('title').notNull(),
    category: text('category').notNull().default('general'),
    groupKey: text('group_key'),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').notNull().default('pending'),
    dueAt: timestamp('due_at', { mode: 'date' }),
    note: text('note'),
    minutesWorked: integer('minutes_worked'),
    hourlyRateCents: integer('hourly_rate_cents'),
    includeWorkDetails: boolean('include_work_details').notNull().default(false),
    paidAt: timestamp('paid_at', { mode: 'date' }),
    incomeTransactionId: text('income_transaction_id').references(() => financeTransactions.id, {
      onDelete: 'set null',
    }),
    lastReminderSentAt: timestamp('last_reminder_sent_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_finance_receivables_user').on(table.userId),
    index('idx_finance_receivables_status').on(table.status),
    index('idx_finance_receivables_due').on(table.dueAt),
    index('idx_finance_receivables_payer').on(table.payerName),
    index('idx_finance_receivables_group').on(table.groupKey),
  ],
);
