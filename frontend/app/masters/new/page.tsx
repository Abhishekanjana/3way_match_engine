'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarMain } from '@/components/layout/SidebarMain';
import { Button } from '@/components/ui/Button';
import { SkuForm } from '@/components/masters/SkuForm';
import { useCreateSku } from '@/hooks/useDocuments';
import type { SkuMasterInput } from '@/types/api';

export default function NewSkuPage() {
  const router = useRouter();
  const createSku = useCreateSku();

  async function handleSubmit(values: SkuMasterInput) {
    await createSku.mutateAsync(values);
    router.push('/masters');
  }

  return (
    <AuthGuard>
      <div className="page-shell flex min-h-screen">
        <Sidebar />
        <SidebarMain className="min-w-0 flex-1 p-6">
          <div className="mb-6">
            <Link href="/masters" className="link-primary text-sm">
              ← Back to SKU Master
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-brand-foreground">Add SKU</h1>
          </div>
          <div className="card-surface max-w-2xl p-6">
            <SkuForm
              onSubmit={handleSubmit}
              isSubmitting={createSku.isPending}
              error={createSku.error instanceof Error ? createSku.error.message : null}
            />
          </div>
        </SidebarMain>
      </div>
    </AuthGuard>
  );
}
