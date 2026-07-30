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
