'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home, LogOut, Package, Upload } from 'lucide-react';
import { clearToken } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sidebar-expanded';

export function Sidebar({ onUploadClick }: { onUploadClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setExpanded(stored === 'true');
    }
    setMounted(true);
  }, []);

  function toggleExpanded() {
    setExpanded((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  const items = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/masters', icon: Package, label: 'SKU Master' },
  ];

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        'flex shrink-0 flex-col border-r border-brand-border bg-white py-4 transition-[width] duration-200 ease-in-out',
        !mounted ? 'w-56' : expanded ? 'w-56' : 'w-[72px]'
      )}
    >
      <div
        className={cn(
          'mb-4 flex items-center px-3',
          expanded ? 'justify-between gap-2' : 'flex-col gap-3'
        )}
      >
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center justify-center">
          {expanded ? (
            <Image
              src="/logos/logo-finifi-full.png"
              alt="Finifi"
              width={160}
              height={40}
              priority
              className="h-9 w-auto max-w-full object-contain"
            />
          ) : (
            <Image
              src="/logos/logo-finifi-icon.png"
              alt="Finifi"
              width={40}
              height={40}
              priority
              className="h-9 w-9 object-contain"
            />
          )}
        </Link>

        <button
          type="button"
          onClick={toggleExpanded}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-border text-brand-muted transition hover:bg-brand-primary-light hover:text-brand-primary"
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'flex items-center rounded-lg transition',
                expanded ? 'gap-3 px-3 py-2.5' : 'h-10 w-full justify-center',
                active
                  ? 'bg-brand-primary-light text-brand-primary'
                  : 'text-brand-muted hover:bg-brand-surface hover:text-brand-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate text-sm font-medium">{label}</span>}
            </Link>
          );
        })}

        <button
          type="button"
          title="Upload"
          onClick={onUploadClick}
          className={cn(
            'flex items-center rounded-lg text-brand-muted transition hover:bg-brand-surface hover:text-brand-foreground',
            expanded ? 'gap-3 px-3 py-2.5' : 'h-10 w-full justify-center'
          )}
        >
          <Upload className="h-5 w-5 shrink-0" />
          {expanded && <span className="truncate text-sm font-medium">Upload</span>}
        </button>
      </nav>

      <div className="mt-auto px-2">
        <button
          type="button"
          title="Logout"
          onClick={logout}
          className={cn(
            'flex items-center rounded-lg text-brand-muted transition hover:bg-brand-surface hover:text-brand-foreground',
            expanded ? 'w-full gap-3 px-3 py-2.5' : 'h-10 w-full justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {expanded && <span className="truncate text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
