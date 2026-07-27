import { cn } from '../lib/utils';
import { ReactNode } from 'react';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-[#2B2930]", className)}
      {...props}
    />
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-video w-full rounded-3xl border border-white/5" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0 border border-white/5" />
        <div className="flex flex-col gap-2 w-full pt-1">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md mt-1" />
        </div>
      </div>
    </div>
  );
}
