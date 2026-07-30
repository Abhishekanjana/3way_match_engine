'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  EmptyState,
  LoadingBlock,
  MatchErrorState,
} from '@/components/layout/AppShell';
import { SubTabPills } from '@/components/layout/SubTabPills';
import {
  DocumentFormPanel,
  buildInvoiceSections,
} from '@/components/documents/DocumentFormPanel';
import { FilePreview } from '@/components/documents/FilePreview';
import { ItemGrid } from '@/components/documents/ItemGrid';
import { useDocument } from '@/hooks/useDocuments';
import { useMatch } from '@/hooks/useMatch';

export default function FulfillmentContent({
  params,
}: {
  params: { poNumber: string };
}) {
  const poNumber = decodeURIComponent(params.poNumber);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: match, isLoading, error } = useMatch(poNumber);

  const invoices = useMemo(
    () => match?.linkedDocuments.invoices ?? [],
    [match?.linkedDocuments.invoices]
  );
  const docParam = searchParams.get('doc');
  const activeId = docParam ?? invoices[0]?.id;
  const activeInvoice = invoices.find((invoice) => invoice.id === activeId) ?? invoices[0];

  const { data: document } = useDocument(activeInvoice?.id);
  const { data: poDocument } = useDocument(match?.linkedDocuments.purchaseOrders[0]?.id);

  useEffect(() => {
    const firstId = invoices[0]?.id;
    if (firstId && !docParam) {
      router.replace(
        `/match/${encodeURIComponent(poNumber)}/fulfillment?doc=${firstId}`,
        { scroll: false }
      );
    }
  }, [invoices, docParam, poNumber, router]);

  const netAmount = useMemo(() => {
    if (!document?.items) {
      return undefined;
    }

    return document.items.reduce((total, item) => {
      const rate = item.unitRate ?? 0;
      const qty = item.quantity ?? 0;
      return total + rate * qty;
    }, 0);
  }, [document]);

  if (isLoading) {
    return <LoadingBlock />;
  }

  if (error) {
    return (
      <MatchErrorState
        message={error instanceof Error ? error.message : 'Failed to load match data'}
      />
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No Invoices uploaded"
        description="Upload an Invoice document to view Fulfillment details."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SubTabPills
        prefix="Invoice"
        items={invoices.map((invoice) => ({ id: invoice.id, label: invoice.number }))}
        activeId={activeInvoice?.id}
        onSelect={(id) =>
          router.push(
            `/match/${encodeURIComponent(poNumber)}/fulfillment?doc=${id}`,
            { scroll: false }
          )
        }
      />

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        <DocumentFormPanel
          sections={buildInvoiceSections({
            invoiceNumber: document?.invoiceNumber ?? activeInvoice?.number,
            invoiceDate: document?.invoiceDate ?? activeInvoice?.date,
            netAmount,
            poNumber,
            poDate: poDocument?.poDate ?? match?.linkedDocuments.purchaseOrders[0]?.date,
          })}
        />
        <FilePreview
          documentId={activeInvoice?.id}
          mimeType={document?.mimeType}
          fileName={document?.originalFileName}
        />
      </div>

      <div className="px-4 pb-4">
        <ItemGrid items={match?.items ?? []} mode="invoice" />
      </div>
    </div>
  );
}
