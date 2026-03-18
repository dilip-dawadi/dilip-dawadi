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
    recurrence: z.enum(['once', 'daily', 'weekly', 'every-n-days']).default('once'),
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

export type AboutFormData = z.infer<typeof aboutFormSchema>;
export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type BlogPostFormData = z.infer<typeof blogPostFormSchema>;
export type TodoFormData = z.infer<typeof todoFormSchema>;
export type UpdateTodoData = z.infer<typeof updateTodoSchema>;
