import { cn } from '@/lib/utils';
import type { MatchStatus } from '@/types/api';

const styles: Record<MatchStatus, string> = {
  matched: 'bg-green-100 text-green-800 border-green-200',
  partially_matched: 'bg-amber-100 text-amber-800 border-amber-200',
  mismatch: 'bg-red-100 text-red-800 border-red-200',
  insufficient_documents: 'bg-brand-card text-brand-muted border-brand-border',
};

export function StatusBadge({
  status,
  label,
}: {
  status: MatchStatus | string;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status as MatchStatus] ?? 'bg-brand-card text-brand-muted border-brand-border'
      )}
    >
      {label}
    </span>
  );
}

export function TabCountBadge({
  count,
  active,
}: {
  count: number;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        'ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-none',
        active
          ? 'bg-brand-primary text-white'
          : 'border border-brand-border bg-brand-card text-brand-muted'
      )}
    >
      {count}
    </span>
  );
}
