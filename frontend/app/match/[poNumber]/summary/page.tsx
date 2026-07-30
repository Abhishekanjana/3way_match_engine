'use client';

import {
  LoadingBlock,
  MatchErrorState,
} from '@/components/layout/AppShell';
import { StatCard } from '@/components/summary/StatCard';
import { CumulativeTable } from '@/components/summary/CumulativeTable';
import { SummarySectionTabs } from '@/components/summary/SummarySectionTabs';
import { useSummary } from '@/hooks/useSummary';

export default function SummaryPage({
  params,
}: {
  params: { poNumber: string };
}) {
  const poNumber = decodeURIComponent(params.poNumber);
  const { data: summary, isLoading, error } = useSummary(poNumber);

  if (isLoading) {
    return <LoadingBlock label="Loading summary…" />;
  }

  if (error) {
    return (
      <MatchErrorState
        message={error instanceof Error ? error.message : 'Failed to load summary'}
      />
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="p-6">
      <SummarySectionTabs
        summaryContent={
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="PO Amount" value={summary.poAmount} tone="po" />
              <StatCard label="Total Invoiced" value={summary.totalInvoiced} tone="invoiced" />
              <StatCard label="Total Received" value={summary.totalReceived} tone="received" />
            </div>

            <CumulativeTable poNumber={poNumber} summary={summary} />
          </div>
        }
      />
    </div>
  );
}
