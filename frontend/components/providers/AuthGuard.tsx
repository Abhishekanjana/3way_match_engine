'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  if (!isAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-surface text-sm text-brand-muted">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
