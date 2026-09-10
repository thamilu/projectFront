import { Skeleton } from '@/shared/ui/atoms/skeleton';

export default function StoresLoading() {
  return (
    <div className="animate-in fade-in container mx-auto px-4 py-10 duration-500 lg:px-8">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mx-auto mt-3 h-4 w-96 max-w-full" />
      </header>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
            <div className="mt-4 flex gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
