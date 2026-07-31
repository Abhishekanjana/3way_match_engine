'use client';

import { cn } from '@/lib/utils';

export function SidebarMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={cn('min-w-0 flex-1', className)}>{children}</main>;
}
