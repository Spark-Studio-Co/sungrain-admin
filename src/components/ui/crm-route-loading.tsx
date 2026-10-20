import { Skeleton } from "./skeleton";

export function CrmRouteLoading() {
  return (
    <div
      data-route-loading
      role="status"
      aria-label="Загрузка страницы"
      aria-busy="true"
      className="min-h-96 w-full min-w-0 space-y-5 p-4 sm:p-6"
    >
      <span className="sr-only">Загрузка страницы…</span>
      <div aria-hidden="true" className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-sm space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="hidden h-10 w-36 shrink-0 sm:block" />
        </div>
        <div className="flex gap-3 border-y border-[#dfe7df] py-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="hidden h-10 w-32 sm:block" />
        </div>
        <div className="divide-y divide-[#e7ece7]">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 py-5">
              <Skeleton className="size-9 shrink-0" />
              <Skeleton className="h-4 w-2/5 max-w-xs" />
              <Skeleton className="ml-auto h-4 w-1/5 max-w-36" />
              <Skeleton className="hidden h-6 w-20 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
