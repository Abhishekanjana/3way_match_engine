'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { SkuForm } from '@/components/masters/SkuForm';
import { useSkuMaster, useUpdateSku } from '@/hooks/useDocuments';
import type { SkuMasterInput } from '@/types/api';

export default function EditSkuPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: sku, isLoading } = useSkuMaster(params.id);
  const updateSku = useUpdateSku(params.id);

  async function handleSubmit(values: SkuMasterInput) {
    await updateSku.mutateAsync(values);
    router.push('/masters');
  }

  return (
    <AuthGuard>
      <div className="page-shell flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Link href="/masters" className="link-primary text-sm">
              ← Back to SKU Master
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-brand-foreground">Edit SKU</h1>
          </div>
          <div className="card-surface max-w-2xl p-6">
            {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
            {sku && (
              <SkuForm
                initialValues={sku}
                onSubmit={handleSubmit}
                isSubmitting={updateSku.isPending}
                error={updateSku.error instanceof Error ? updateSku.error.message : null}
              />
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
