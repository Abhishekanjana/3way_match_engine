'use client';

import { Suspense } from 'react';
import LoginPage from './LoginForm';

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-surface text-sm text-brand-muted">
          Loading…
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
