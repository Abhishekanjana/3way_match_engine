'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchAuditResponse } from '@/types/api';

function humanizeStep(step: string) {
  return step
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusStyles(status: string) {
  switch (status) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800';
    case 'warning':
      return 'bg-amber-100 text-amber-900';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'started':
      return 'bg-brand-primary-light text-brand-primary';
    default:
      return 'bg-brand-card text-brand-muted';
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MatchTimeline({
  audit,
  isLoading,
  error,
}: {
  audit?: MatchAuditResponse;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-red-600">
        {error.message || 'Failed to load timeline'}
      </p>
    );
  }

  const steps = audit?.steps ?? [];

  if (steps.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-brand-muted">
        No upload activity recorded for this PO yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {steps.map((entry, index) => (
        <li key={`${entry.step}-${entry.at}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
          {index < steps.length - 1 && (
            <span
              className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-brand-border"
              aria-hidden="true"
            />
          )}

          <span
            className="relative z-[1] mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-brand-primary bg-white"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1 rounded-lg border border-brand-border bg-brand-card/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-brand-foreground">
                {humanizeStep(entry.step)}
              </p>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  statusStyles(entry.status)
                )}
              >
                {entry.status}
              </span>
              <span className="text-xs text-brand-muted">{formatTimestamp(entry.at)}</span>
            </div>
            {entry.message && (
              <p className="mt-2 text-sm text-brand-muted">{entry.message}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
