'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import { blogPostFormSchema } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { InputWithLabel } from '@/components/ui/input-with-label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BlogCardSkeleton } from '@/components/Admin/LoadingSkeletons';
import { TextAreaWithLabel } from '@/components/ui/TextAreaWithLabel';

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WritingAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      slug: '',
      title: '',
      description: '',
      content: '',
      coverImage: '',
      published: false,
    },
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    try {
      const method = editingPost ? 'PUT' : 'POST';
      const url = editingPost ? `/api/blog?id=${editingPost.id}` : '/api/blog';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save post');
      }

      toast.success(`Post ${editingPost ? 'updated' : 'created'} successfully!`);
      form.reset();
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    form.reset({
      slug: post.slug,
      title: post.title,
      description: post.description,
      content: post.content,
      coverImage: post.coverImage || '',
      published: post.published,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');

      toast.success('Post deleted successfully!');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    form.reset({
      slug: '',
      title: '',
      description: '',
      content: '',
      coverImage: '',
      published: false,
    });
  };

  return (
    <AdminLayout title="Blog">
      <div className="mx-auto max-w-7xl">
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</CardTitle>
            <CardDescription>
              {editingPost ? 'Update your blog post details' : 'Write and publish a new blog post'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <InputWithLabel
                    fieldTitle="Title"
                    nameInSchema="title"
                    placeholder="Enter post title"
                    required
                  />

                  <InputWithLabel
                    fieldTitle="Slug"
                    nameInSchema="slug"
                    placeholder="post-url-slug"
                    required
                  />
                </div>

                <TextAreaWithLabel
                  fieldTitle="Description"
                  nameInSchema="description"
                  placeholder="Brief description of your post..."
                  required
                  rows={3}
                />

                <InputWithLabel
                  fieldTitle="Cover Image URL"
                  nameInSchema="coverImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                />

                <TextAreaWithLabel
                  fieldTitle="Content (Markdown)"
                  nameInSchema="content"
                  placeholder="Write your post content in Markdown..."
                  required
                  rows={14}
                />

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-2"
                        />
                      </FormControl>
                      <FormLabel className="-mt-1!">Publish post</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(37, 99, 235)' }}
                  >
                    {form.formState.isSubmitting
                      ? 'Saving...'
                      : editingPost
                        ? 'Update Post'
                        : 'Create Post'}
                  </button>

                  {editingPost && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-bold)' }}>
            All Posts
          </h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <BlogCardSkeleton />
              <BlogCardSkeleton />
              <BlogCardSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center" style={{ color: 'var(--color-fg-light)' }}>
                  No posts yet. Create your first one above!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                      <span
                        className="rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: post.published
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(156, 163, 175, 0.2)',
                          color: post.published ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)',
                        }}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <CardDescription className="line-clamp-2">{post.description}</CardDescription>
                    <p className="text-xs" style={{ color: 'var(--color-fg-light)' }}>
                      /{post.slug}
                    </p>
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                      style={{ border: '1px solid rgb(37, 99, 235)', color: 'rgb(37, 99, 235)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                      style={{ border: '1px solid rgb(220, 38, 38)', color: 'rgb(220, 38, 38)' }}
                    >
                      Delete
                    </button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
