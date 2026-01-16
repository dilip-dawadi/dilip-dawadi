import { Skeleton } from '@/components/ui/skeleton';

export function ProjectCardSkeleton() {
  return (
    <div
      className="rounded-lg p-4 shadow-sm"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-alt)',
      }}
    >
      <Skeleton className="h-40 w-full mb-3 rounded-md" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-20 mb-3" />
      <div className="flex gap-1 mb-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div
      className="rounded-lg p-4 shadow-sm"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-alt)',
      }}
    >
      <div className="mb-2 flex justify-between items-start">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-32 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
