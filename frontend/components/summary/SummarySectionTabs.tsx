'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type SummaryView = 'summary' | 'timeline';

export function SummarySectionTabs({
  summaryContent,
}: {
  summaryContent: React.ReactNode;
}) {
  const [view, setView] = useState<SummaryView>('summary');

  const tabs: Array<{ id: SummaryView; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
      <div className="border-b border-brand-border px-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn(
                'relative py-4 text-sm font-medium transition',
                view === tab.id ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-foreground'
              )}
            >
              {tab.label}
              {view === tab.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {view === 'summary' && <div className="p-6">{summaryContent}</div>}
    </div>
  );
}
