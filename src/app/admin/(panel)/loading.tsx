import Skeleton from '@/components/Skeleton';

export default function PanelLoading() {
  return (
    <div role="status" aria-label="Cargando" className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
