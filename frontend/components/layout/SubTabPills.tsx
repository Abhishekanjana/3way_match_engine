'use client';

import { cn } from '@/lib/utils';

export function SubTabPills({
  items,
  activeId,
  onSelect,
  prefix,
}: {
  items: Array<{ id: string; label: string }>;
  activeId?: string;
  onSelect: (id: string) => void;
  prefix: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-brand-border bg-brand-card px-4 py-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition',
            activeId === item.id
              ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
              : 'border-brand-border bg-white text-brand-muted hover:border-brand-primary/40 hover:text-brand-foreground'
          )}
        >
          {prefix}: {item.label}
        </button>
      ))}
    </div>
  );
}
