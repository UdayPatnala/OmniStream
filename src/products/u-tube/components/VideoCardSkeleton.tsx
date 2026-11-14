import React from 'react';
import { Skeleton } from '@omnistream/shared';

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-video w-full rounded-3xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 w-full pt-1">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md mt-1" />
        </div>
      </div>
    </div>
  );
}
