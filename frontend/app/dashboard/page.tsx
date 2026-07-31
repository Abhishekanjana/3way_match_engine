'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarMain } from '@/components/layout/SidebarMain';
import { UploadModal } from '@/components/upload/UploadModal';
import { Button } from '@/components/ui/Button';
import { usePoNumbers } from '@/hooks/useDocuments';

export default function DashboardPage() {
  const router = useRouter();
  const { data: poNumbers = [], isLoading, isError, error } = usePoNumbers();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [manualPo, setManualPo] = useState('');

  function openPo() {
    const trimmed = manualPo.trim();
    if (trimmed) {
      router.push(`/match/${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <AuthGuard>
      <div className="page-shell flex min-h-screen">
        <Sidebar onUploadClick={() => setUploadOpen(true)} />
        <SidebarMain className="min-w-0 flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-foreground">Dashboard</h1>
              <p className="text-sm text-brand-muted">Upload documents and open PO workspaces.</p>
            </div>
            <Button onClick={() => setUploadOpen(true)}>Upload Document</Button>
          </div>

          <div className="card-surface mb-6 p-4">
            <label htmlFor="manual-po" className="mb-1 block text-sm font-medium text-brand-foreground">
              Open PO by number
            </label>
            <div className="flex gap-2">
              <input
                id="manual-po"
                value={manualPo}
                onChange={(event) => setManualPo(event.target.value)}
                placeholder="e.g. CI4PO05788"
                className="input-field flex-1"
              />
              <Button type="button" onClick={openPo}>
                Open
              </Button>
            </div>
          </div>

          <div className="card-surface overflow-hidden">
            <div className="border-b border-brand-border px-4 py-3">
              <h2 className="text-sm font-semibold text-brand-foreground">Recent Purchase Orders</h2>
            </div>
            {isLoading && <p className="p-4 text-sm text-brand-muted">Loading…</p>}
            {isError && (
              <p className="p-4 text-sm text-red-600">
                {error instanceof Error ? error.message : 'Failed to load purchase orders'}
              </p>
            )}
            {!isLoading && !isError && poNumbers.length === 0 && (
              <p className="p-4 text-sm text-brand-muted">
                No documents uploaded yet. Upload a Purchase Order to begin.
              </p>
            )}
            <ul className="divide-y divide-brand-border">
              {poNumbers.map((poNumber) => (
                <li key={poNumber}>
                  <Link
                    href={`/match/${encodeURIComponent(poNumber)}`}
                    className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-brand-primary-light/50"
                  >
                    <span className="font-medium text-brand-foreground">{poNumber}</span>
                    <span className="link-primary">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </SidebarMain>
        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      </div>
    </AuthGuard>
  );
}
