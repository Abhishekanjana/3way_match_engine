'use client';

import { AuthGuard } from '@/components/providers/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';

export default function MatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { poNumber: string };
}) {
  return (
    <AuthGuard>
      <AppShell poNumber={decodeURIComponent(params.poNumber)}>{children}</AppShell>
    </AuthGuard>
  );
}
