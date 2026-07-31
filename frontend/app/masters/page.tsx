'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarMain } from '@/components/layout/SidebarMain';
import { UploadModal } from '@/components/upload/UploadModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useDeleteSku, useSkuMasters } from '@/hooks/useDocuments';
import { formatCurrency } from '@/lib/utils';

export default function MastersPage() {
  const { data: skus, isLoading, isError, error: loadError } = useSkuMasters();
  const deleteSku = useDeleteSku();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteId) {
      return;
    }

    try {
      await deleteSku.mutateAsync(deleteId);
      setDeleteId(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <AuthGuard>
      <div className="page-shell flex min-h-screen">
        <Sidebar onUploadClick={() => setUploadOpen(true)} />
        <SidebarMain className="min-w-0 flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-foreground">SKU Master</h1>
              <p className="text-sm text-brand-muted">Manage ERP codes, rates, and MRP for matching.</p>
            </div>
            <Link href="/masters/new">
              <Button>+ Add SKU</Button>
            </Link>
          </div>

          {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}

          <div className="card-surface-white overflow-hidden">
            {isLoading && <p className="p-4 text-sm text-brand-muted">Loading…</p>}
            {isError && (
              <p className="p-4 text-sm text-red-600">
                {loadError instanceof Error ? loadError.message : 'Failed to load SKU master'}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-brand-card text-xs uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">ERP Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">EAN</th>
                    <th className="px-4 py-3">HSN</th>
                    <th className="px-4 py-3">UOM</th>
                    <th className="px-4 py-3">Agreed Rate</th>
                    <th className="px-4 py-3">MRP</th>
                    <th className="px-4 py-3">Tolerance</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skus?.map((sku) => (
                    <tr key={sku._id} className="border-t border-brand-border">
                      <td className="px-4 py-3 font-medium text-brand-foreground">{sku.skuErpCode}</td>
                      <td className="px-4 py-3 text-brand-foreground">{sku.name}</td>
                      <td className="px-4 py-3 text-brand-muted">{sku.eanCode ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-muted">{sku.hsnCode ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-muted">{sku.uom ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-foreground">{formatCurrency(sku.agreedRate)}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {sku.mrp != null ? formatCurrency(sku.mrp) : '—'}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">
                        {((sku.priceTolerance ?? 0.05) * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/masters/${sku._id}/edit`} className="link-primary">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => setDeleteId(sku._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SidebarMain>
        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
        <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete SKU">
          <p className="text-sm text-brand-muted">Are you sure you want to delete this SKU master record?</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteSku.isPending}>
              Delete
            </Button>
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
