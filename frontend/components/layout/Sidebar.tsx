'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home, LogOut, Package, Upload } from 'lucide-react';
import { clearToken } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sidebar-expanded';

function SidebarLabel({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'overflow-hidden whitespace-nowrap text-sm font-medium',
        'transition-[max-width,opacity,margin] duration-300 ease-in-out',
        expanded ? 'ml-3 max-w-[160px] opacity-100' : 'ml-0 max-w-0 opacity-0'
      )}
      aria-hidden={!expanded}
    >
      {children}
    </span>
  );
}

function NavItem({
  expanded,
  active,
  href,
  icon: Icon,
  label,
}: {
  expanded: boolean;
  active: boolean;
  href: string;
  icon: typeof Home;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      title={label}
      className={cn(
        'group flex h-10 items-center overflow-hidden rounded-lg',
        'transition-[background-color,color,padding] duration-300 ease-in-out',
        expanded ? 'px-3' : 'justify-center px-0',
        active
          ? 'bg-brand-primary-light text-brand-primary font-medium'
          : 'text-brand-muted hover:bg-brand-surface hover:text-brand-foreground'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out',
          !expanded && 'group-hover:scale-110'
        )}
      />
      <SidebarLabel expanded={expanded}>{label}</SidebarLabel>
    </Link>
  );
}

function ActionItem({
  expanded,
  label,
  icon: Icon,
  onClick,
}: {
  expanded: boolean;
  label: string;
  icon: typeof Upload;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        'group flex h-10 items-center overflow-hidden rounded-lg text-brand-muted',
        'transition-[background-color,color,padding] duration-300 ease-in-out',
        'hover:bg-brand-surface hover:text-brand-foreground',
        expanded ? 'w-full px-3' : 'w-full justify-center px-0'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out',
          !expanded && 'group-hover:scale-110'
        )}
      />
      <SidebarLabel expanded={expanded}>{label}</SidebarLabel>
    </button>
  );
}

export function Sidebar({ onUploadClick }: { onUploadClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setExpanded(stored === 'true');
    }

    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
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
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden border-r border-brand-border bg-white py-4',
        expanded ? 'w-56' : 'w-[72px]',
        animate ? 'transition-[width] duration-300 ease-in-out' : 'transition-none'
      )}
    >
      {/* Header — logo centered; toggle aligned to same row (expanded) or stacked (collapsed) */}
      {expanded ? (
        <div className="relative mb-4 h-12 shrink-0 px-3">
          <Link
            href="/dashboard"
            className="absolute inset-0 flex items-center justify-center"
          >
            <Image
              src="/logos/logo-finifi-full.png"
              alt="Finifi"
              width={160}
              height={40}
              priority
              className="h-8 w-auto max-w-[148px] object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={toggleExpanded}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className={cn(
              'absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md',
              'text-brand-muted transition-colors duration-200',
              'hover:bg-brand-primary-light hover:text-brand-primary'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mb-4 flex shrink-0 flex-col items-center justify-center gap-2 px-2">
          <Link href="/dashboard" className="flex h-9 items-center justify-center">
            <Image
              src="/logos/logo-finifi-icon.png"
              alt="Finifi"
              width={40}
              height={40}
              priority
              className="h-9 w-9 object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={toggleExpanded}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-brand-muted transition-colors duration-200',
              'hover:bg-brand-primary-light hover:text-brand-primary'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {items.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            expanded={expanded}
            active={pathname.startsWith(href)}
          />
        ))}

        <ActionItem expanded={expanded} label="Upload" icon={Upload} onClick={onUploadClick} />
      </nav>

      <div className="mt-auto px-2">
        <ActionItem expanded={expanded} label="Logout" icon={LogOut} onClick={logout} />
      </div>
    </aside>
  );
}
