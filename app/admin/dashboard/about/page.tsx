'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '@/components/Admin/AdminLayout';
import { aboutFormSchema, type AboutFormData } from '@/lib/validations';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { TextAreaWithLabel } from '@/components/ui/TextAreaWithLabel';

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);

  const form = useForm<AboutFormData>({
    resolver: zodResolver(aboutFormSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/about');
      const data = await res.json();
      form.reset({ content: data.content || '' });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  };

  const onSubmit = async (data: AboutFormData) => {
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Content saved successfully!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Error saving content');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="About">
        <div
          className="rounded-lg p-6 shadow-sm"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-alt)',
          }}
        >
          <div className="mb-6">
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="About">
      <div
        className="rounded-lg p-6 shadow-sm"
        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-alt)' }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-fg-bold)' }}>
                  About Content Editor
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-fg-light)' }}>
                  Edit your about page content using Markdown
                </p>
              </div>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <TextAreaWithLabel
              fieldTitle="Content (Markdown)"
              nameInSchema="content"
              className="h-96 font-mono text-sm"
              placeholder="Enter your about content in Markdown format..."
              required
            />
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
