'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarMain } from '@/components/layout/SidebarMain';
import { TabBar } from '@/components/layout/TabBar';
import { UploadModal } from '@/components/upload/UploadModal';
import { StatusBadge } from '@/components/ui/Badge';
import { useMatch } from '@/hooks/useMatch';
import { matchStatusLabel } from '@/lib/utils';
import type { MatchStatus } from '@/types/api';

export function AppShell({
  poNumber,
  children,
}: {
  poNumber: string;
  children: React.ReactNode;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: match } = useMatch(poNumber);

  const counts = {
    po: match?.linkedDocuments.purchaseOrders.length ?? 0,
    invoices: match?.linkedDocuments.invoices.length ?? 0,
    grns: match?.linkedDocuments.grns.length ?? 0,
  };

  return (
    <div className="page-shell flex min-h-screen">
      <Sidebar onUploadClick={() => setUploadOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col transition-[width] duration-300 ease-in-out">
        <TabBar poNumber={poNumber} counts={counts} />
        <div className="border-b border-brand-border bg-brand-card px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-brand-foreground">PO: {poNumber}</h1>
            {match && (
              <StatusBadge status={match.status} label={matchStatusLabel(match.status)} />
            )}
          </div>
        </div>
        <SidebarMain className="flex-1 overflow-auto bg-brand-surface">{children}</SidebarMain>
      </div>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center p-12 text-sm text-brand-muted">{label}</div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-surface mx-4 my-8 border-dashed p-10 text-center">
      <h2 className="text-lg font-semibold text-brand-foreground">{title}</h2>
      <p className="mt-2 text-sm text-brand-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MatchErrorState({ message }: { message: string }) {
  return (
    <div className="mx-4 my-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export type { MatchStatus };
