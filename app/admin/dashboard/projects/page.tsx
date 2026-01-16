'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import { projectFormSchema } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InputWithLabel } from '@/components/ui/input-with-label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProjectCardSkeleton } from '@/components/Admin/LoadingSkeletons';
import { TextAreaWithLabel } from '@/components/ui/TextAreaWithLabel';

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface Project {
  id: string;
  title: string;
  subtitle: string | null;
  link: string | null;
  image: string;
  date: string;
  description: string;
  tech: string[] | null;
  featured: boolean;
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      link: '',
      image: '',
      date: '',
      description: '',
      tech: '',
      featured: false,
    },
  });

  const tech = form.watch('tech', '') as string;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const method = editingProject ? 'PUT' : 'POST';
      const url = editingProject ? `/api/projects?id=${editingProject.id}` : '/api/projects';

      const projectData = {
        ...data,
        tech: data.tech
          ? data.tech
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [],
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save project');
      }

      toast.success(`Project ${editingProject ? 'updated' : 'created'} successfully!`);
      form.reset();
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      title: project.title,
      subtitle: project.subtitle || '',
      link: project.link || '',
      image: project.image,
      date: project.date,
      description: project.description,
      tech: project.tech ? project.tech.join(', ') : '',
      featured: project.featured,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');

      toast.success('Project deleted successfully!');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const cancelEdit = () => {
    setEditingProject(null);
    form.reset({
      title: '',
      subtitle: '',
      link: '',
      image: '',
      date: '',
      description: '',
      tech: '',
      featured: false,
    });
  };

  return (
    <AdminLayout title="Projects">
      <div className="mx-auto max-w-7xl">
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</CardTitle>
            <CardDescription>
              {editingProject
                ? 'Update project details below'
                : 'Add a new project to your portfolio'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <InputWithLabel
                    fieldTitle="Title"
                    nameInSchema="title"
                    placeholder="Enter project title"
                    required
                  />

                  <InputWithLabel
                    fieldTitle="Subtitle"
                    nameInSchema="subtitle"
                    placeholder="Optional subtitle"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <InputWithLabel
                    fieldTitle="Link"
                    nameInSchema="link"
                    type="url"
                    placeholder="https://example.com"
                  />

                  <InputWithLabel
                    fieldTitle="Image URL"
                    nameInSchema="image"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <InputWithLabel
                  fieldTitle="Date"
                  nameInSchema="date"
                  placeholder="2024-01 or 2024"
                  required
                />

                <TextAreaWithLabel
                  fieldTitle="Description"
                  nameInSchema="description"
                  placeholder="Describe the project"
                  required
                />

                <FormField
                  control={form.control}
                  name="tech"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <InputWithLabel
                            fieldTitle="Technologies"
                            nameInSchema="tech"
                            placeholder="React, TypeScript, Next.js"
                          />
                          {tech && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {tech.split(',').map((t, idx) => {
                                const trimmed = t.trim();
                                return trimmed ? (
                                  <span
                                    key={idx}
                                    className="rounded-full px-3 py-1 text-xs font-medium"
                                    style={{
                                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                      color: 'rgb(59, 130, 246)',
                                    }}
                                  >
                                    {trimmed}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
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
                      <FormLabel className="-mt-1!">Featured project</FormLabel>
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
                      : editingProject
                        ? 'Update Project'
                        : 'Create Project'}
                  </button>

                  {editingProject && (
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
            All Projects
          </h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center" style={{ color: 'var(--color-fg-light)' }}>
                  No projects yet. Create your first one above!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  {project.image && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      {project.featured && (
                        <span
                          className="rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            color: 'rgb(234, 179, 8)',
                          }}
                        >
                          Featured
                        </span>
                      )}
                    </div>
                    {project.subtitle && <CardDescription>{project.subtitle}</CardDescription>}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs" style={{ color: 'var(--color-fg-light)' }}>
                      {project.date}
                    </p>

                    {project.tech && project.tech.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tech.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: 'var(--color-bg)',
                              color: 'var(--color-fg)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                        {project.tech.length > 2 && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: 'var(--color-bg)',
                              color: 'var(--color-fg)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            +{project.tech.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                      style={{
                        border: '1px solid rgb(37, 99, 235)',
                        backgroundColor: 'rgba(37, 99, 235, 0.2)',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                      style={{
                        border: '1px solid rgb(220, 38, 38)',
                        backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      }}
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
