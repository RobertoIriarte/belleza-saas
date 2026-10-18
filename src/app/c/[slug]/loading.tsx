import Skeleton from '@/components/Skeleton';

export default function SiteLoading() {
  return (
    <div role="status" aria-label="Cargando" className="mx-auto max-w-6xl px-5 py-10">
      <Skeleton className="h-12 w-56" />
      <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-11 w-48" />
        </div>
        <Skeleton className="aspect-[4/3] md:aspect-[4/5]" />
      </div>
    </div>
  );
}
