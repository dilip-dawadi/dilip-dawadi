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

export type AboutFormData = z.infer<typeof aboutFormSchema>;
export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type BlogPostFormData = z.infer<typeof blogPostFormSchema>;
