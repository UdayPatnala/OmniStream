import { cn } from '../utils/utils';
import type { HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-neutral-800/40 border border-neutral-700/30", className)}
      {...props}
    />
  );
}
