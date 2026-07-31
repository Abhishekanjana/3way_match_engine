'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLogin } from '@/hooks/useMatch';
import { setToken } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const result = await login.mutateAsync();
      setToken(result.token);
      const next = searchParams.get('next') ?? '/dashboard';
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        <section className="mb-10 max-w-xl lg:mb-0 lg:flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white/80 px-3 py-1 text-xs font-medium text-brand-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            Operations AI that Operates
          </div>

          <div className="mb-6 flex items-center gap-3">
            <Image
              src="/logos/logo-finifi-icon.png"
              alt="Finifi"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="text-sm font-semibold tracking-wide text-brand-foreground">Finifi</p>
              <p className="text-xs text-brand-muted">P2P · Three-Way Match</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground sm:text-4xl lg:text-5xl">
            Three-Way Match
            <span className="block text-brand-primary">Engine</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-brand-muted">
            Auto matching of vendor invoices with PO and GRN — with unmatched reasons,
            exception-first review, and full document traceability.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-brand-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              PO · GRN · Invoice reconciliation
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              Price, MRP &amp; quantity exception handling
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              AI-powered document parsing &amp; SKU mapping
            </li>
          </ul>
        </section>

        <section className="w-full max-w-md shrink-0">
          <div className="rounded-2xl border border-brand-border bg-brand-card p-8 shadow-lg shadow-brand-primary/5">
            <h2 className="text-xl font-semibold text-brand-foreground">Sign in</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Review PO, GRN, and Invoice matches in your workspace.
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-brand-muted"
                >
                  Username
                </label>
                <input id="username" defaultValue="admin" className="input-field" />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-brand-muted"
                >
                  Password
                </label>
                <input id="password" type="password" defaultValue="admin" className="input-field" />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={login.isPending}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {login.isPending ? 'Signing in…' : 'Continue to workspace'}
                {!login.isPending && (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-brand-muted">
              Powered by{' '}
              <a
                href="https://finifi.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="link-primary"
              >
                Finifi
              </a>
              {' · '}3-way match done for you
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
