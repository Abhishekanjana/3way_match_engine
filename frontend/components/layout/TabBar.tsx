'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TabCountBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Tab = {
  label: string;
  href: string;
  count?: number;
};

export function TabBar({
  poNumber,
  counts,
}: {
  poNumber: string;
  counts: { po: number; invoices: number; grns: number };
}) {
  const pathname = usePathname();
  const base = `/match/${encodeURIComponent(poNumber)}`;

  const tabs: Tab[] = [
    { label: 'Purchase Order', href: base, count: counts.po },
    { label: 'Fulfillment', href: `${base}/fulfillment`, count: counts.invoices },
    { label: 'Delivery', href: `${base}/delivery`, count: counts.grns },
    { label: 'Summary', href: `${base}/summary` },
  ];

  return (
    <div className="border-b border-brand-border bg-white px-4">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const active =
            tab.href === base ? pathname === base : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative inline-flex items-center py-3 text-sm font-medium transition',
                active ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-foreground'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <TabCountBadge count={tab.count} active={active} />
              )}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
