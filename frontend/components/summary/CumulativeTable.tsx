'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SummaryResponse } from '@/types/api';

function docLink(row: SummaryResponse['rows'][number], poNumber: string) {
  if (row.documentType === 'Original PO') {
    return `/match/${encodeURIComponent(poNumber)}`;
  }

  if (row.documentType === 'Invoice') {
    return `/match/${encodeURIComponent(poNumber)}/fulfillment`;
  }

  return `/match/${encodeURIComponent(poNumber)}/delivery`;
}

export function CumulativeTable({
  poNumber,
  summary,
}: {
  poNumber: string;
  summary: SummaryResponse;
}) {
  const { rows, currentStatus } = summary;

  return (
    <div className="card-surface-white overflow-hidden">
      <div className="border-b border-brand-border px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-foreground">Associated Invoice &amp; GRN</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-brand-card uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3">Document Type</th>
              <th className="px-4 py-3">Document No.</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Cumulative Invoice</th>
              <th className="px-4 py-3">Cumulative GRN</th>
              <th className="px-4 py-3">Pending Delivery</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.documentType}-${row.documentNo}-${row.date}`} className="border-t border-brand-border">
                <td className="px-4 py-3 text-brand-foreground">{row.documentType}</td>
                <td className="px-4 py-3">
                  <Link href={docLink(row, poNumber)} className="link-primary font-medium">
                    {row.documentNo}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.quantity}</td>
                <td className="px-4 py-3">{row.cumulativeInvoice}</td>
                <td className="px-4 py-3">{row.cumulativeGrn}</td>
                <td
                  className={cn(
                    'px-4 py-3',
                    row.pendingDelivery > 0 && 'font-semibold text-red-600'
                  )}
                >
                  {row.pendingDelivery}
                </td>
              </tr>
            ))}
            <tr className="border-t border-yellow-200 bg-yellow-50 font-medium">
              <td className="px-4 py-3">Current Status</td>
              <td className="px-4 py-3">—</td>
              <td className="px-4 py-3">—</td>
              <td className="px-4 py-3 text-green-700">
                Remaining: {currentStatus.remainingQty}
              </td>
              <td className="px-4 py-3">{currentStatus.cumulativeInvoiceQty}</td>
              <td className="px-4 py-3">{currentStatus.cumulativeGrnQty}</td>
              <td className={cn('px-4 py-3', currentStatus.pendingDelivery > 0 && 'text-red-600')}>
                {currentStatus.pendingDelivery}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
