'use client';

import Link from 'next/link';
import { cn, formatTableDate } from '@/lib/utils';
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
    <div>
      <h3 className="mb-3 text-sm font-semibold text-brand-foreground">Associated Invoice &amp; GRN</h3>
      <div className="overflow-hidden rounded-lg border border-brand-border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-border bg-brand-card/80">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Document No.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Cumulative Invoice</th>
                <th className="px-4 py-3 text-right">Cumulative GRN</th>
                <th className="px-4 py-3 text-right">Pending Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {rows.map((row) => (
                <tr key={`${row.documentType}-${row.documentNo}-${row.date}`}>
                  <td className="px-4 py-3.5 font-medium text-brand-foreground">{row.documentType}</td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={docLink(row, poNumber)}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {row.documentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-brand-muted">
                    {formatTableDate(row.date === '-' ? null : row.date)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-brand-foreground">{row.quantity}</td>
                  <td className="px-4 py-3.5 text-right text-brand-foreground">{row.cumulativeInvoice}</td>
                  <td className="px-4 py-3.5 text-right text-brand-foreground">{row.cumulativeGrn}</td>
                  <td
                    className={cn(
                      'px-4 py-3.5 text-right',
                      row.pendingDelivery > 0 ? 'font-semibold text-red-600' : 'text-brand-foreground'
                    )}
                  >
                    {row.pendingDelivery}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-50/80 font-medium">
                <td className="px-4 py-3.5 text-brand-foreground">Current Status</td>
                <td className="px-4 py-3.5 text-brand-muted">—</td>
                <td className="px-4 py-3.5 text-brand-muted">—</td>
                <td className="px-4 py-3.5 text-right font-semibold text-brand-foreground">
                  Remaining: {currentStatus.remainingQty}
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">
                  {currentStatus.cumulativeInvoiceQty}
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">
                  {currentStatus.cumulativeGrnQty}
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-red-600">
                  {currentStatus.pendingDelivery}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
