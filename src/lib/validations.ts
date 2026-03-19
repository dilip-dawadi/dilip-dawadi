import { z } from 'zod';

export const aboutFormSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

export const projectFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  image: z.string().url('Must be a valid URL'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  tech: z.string().optional(),
  featured: z.boolean().optional(),
});

export const blogPostFormSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  coverImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  published: z.boolean().optional(),
});

const optionalDateTime = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Invalid reminder time');

export const todoFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
    recurrence: z.enum(['once', 'daily', 'weekly', 'monthly', 'every-n-days']).default('once'),
    repeatEveryDays: z
      .number()
      .int('Repeat interval must be an integer')
      .min(1, 'Repeat interval must be at least 1 day')
      .max(365, 'Repeat interval is too large')
      .default(1),
    remindAt: optionalDateTime,
    emailReminder: z.boolean().default(true),
    pushReminder: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.recurrence !== 'once' && !value.remindAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['remindAt'],
        message: 'Reminder date and time are required for recurring reminders',
      });
    }

    if (value.recurrence !== 'every-n-days' && value.repeatEveryDays !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['repeatEveryDays'],
        message: 'Repeat every days is only used for every-n-days recurrence',
      });
    }
  });

export const updateTodoSchema = todoFormSchema.and(
  z.object({
    id: z.string().min(1, 'Todo id is required'),
  }),
);

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url('Invalid push endpoint'),
  keys: z.object({
    p256dh: z.string().min(1, 'Invalid p256dh key'),
    auth: z.string().min(1, 'Invalid auth key'),
  }),
});

const optionalTxnDateTime = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Invalid transaction date');

export const financeTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).default('expense'),
  amountCents: z.number().int('Amount must be a whole number').positive('Amount is required'),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
  note: z.string().max(500, 'Note is too long').optional().or(z.literal('')),
  happenedAt: optionalTxnDateTime,
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['weekly', 'monthly']).optional(),
});

export const updateFinanceTransactionSchema = financeTransactionSchema.and(
  z.object({
    id: z.string().min(1, 'Transaction id is required'),
  }),
);

export const financeSettingsSchema = z.object({
  monthlyLimitCents: z
    .number()
    .int('Monthly limit must be a whole number')
    .min(0, 'Monthly limit cannot be negative'),
  dailyLimitCents: z
    .number()
    .int('Daily limit must be a whole number')
    .min(0, 'Daily limit cannot be negative'),
  monthlySavingsTargetCents: z
    .number()
    .int('Savings target must be a whole number')
    .min(0, 'Savings target cannot be negative'),
  notifyThresholdPercent: z
    .number()
    .int('Threshold must be a whole number')
    .min(50, 'Threshold should be at least 50%')
    .max(100, 'Threshold cannot exceed 100%'),
  smartAlertsEnabled: z.boolean().default(true),
  emailAlertsEnabled: z.boolean().default(true),
  pushAlertsEnabled: z.boolean().default(true),
});

const optionalWorkDateTime = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Invalid work date');

const optionalDueDateTime = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Invalid due date');

export const financeWorkLogSchema = z.object({
  todoId: z.string().optional().or(z.literal('')),
  workDate: optionalWorkDateTime,
  minutesWorked: z
    .number()
    .int('Minutes must be a whole number')
    .min(1, 'Minutes worked must be at least 1')
    .max(1440, 'Minutes worked cannot exceed one day'),
  hourlyRateCents: z
    .number()
    .int('Hourly rate must be a whole number')
    .min(1, 'Hourly rate must be at least 0.01'),
  note: z.string().max(500, 'Note is too long').optional().or(z.literal('')),
});

export const updateFinanceWorkLogSchema = financeWorkLogSchema.and(
  z.object({
    id: z.string().min(1, 'Work log id is required'),
  }),
);

export const financeReceivableSchema = z
  .object({
    todoId: z.string().optional().or(z.literal('')),
    workLogId: z.string().optional().or(z.literal('')),
    payerName: z.string().min(1, 'Payer name is required').max(120, 'Payer name is too long'),
    payerEmail: z.string().email('Invalid payer email').optional().or(z.literal('')),
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    category: z.string().max(80, 'Category is too long').optional().or(z.literal('')),
    groupKey: z.string().max(120, 'Group is too long').optional().or(z.literal('')),
    amountCents: z.number().int('Amount must be a whole number').min(1, 'Amount is required'),
    status: z.enum(['pending', 'paid']).default('pending'),
    dueAt: optionalDueDateTime,
    note: z.string().max(500, 'Note is too long').optional().or(z.literal('')),
    minutesWorked: z.number().int().min(1).max(100000).optional(),
    hourlyRateCents: z.number().int().min(1).optional(),
    includeWorkDetails: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.includeWorkDetails && (!value.minutesWorked || !value.hourlyRateCents)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['includeWorkDetails'],
        message: 'Hours and rate are required when including work details',
      });
    }
  });

export const updateFinanceReceivableSchema = financeReceivableSchema.and(
  z.object({
    id: z.string().min(1, 'Receivable id is required'),
  }),
);

export const financeReceivableBulkPaySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one receivable is required'),
});

export const financeReceivableReminderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one receivable is required'),
  customMessage: z.string().max(1000, 'Message is too long').optional().or(z.literal('')),
  includeWorkDetails: z.boolean().optional(),
});

export type AboutFormData = z.infer<typeof aboutFormSchema>;
export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type BlogPostFormData = z.infer<typeof blogPostFormSchema>;
export type TodoFormData = z.infer<typeof todoFormSchema>;
export type UpdateTodoData = z.infer<typeof updateTodoSchema>;
export type FinanceTransactionData = z.infer<typeof financeTransactionSchema>;
export type UpdateFinanceTransactionData = z.infer<typeof updateFinanceTransactionSchema>;
export type FinanceSettingsData = z.infer<typeof financeSettingsSchema>;
export type FinanceWorkLogData = z.infer<typeof financeWorkLogSchema>;
export type UpdateFinanceWorkLogData = z.infer<typeof updateFinanceWorkLogSchema>;
export type FinanceReceivableData = z.infer<typeof financeReceivableSchema>;
export type UpdateFinanceReceivableData = z.infer<typeof updateFinanceReceivableSchema>;
