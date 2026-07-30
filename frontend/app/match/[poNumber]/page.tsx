'use client';

import {
  EmptyState,
  LoadingBlock,
  MatchErrorState,
} from '@/components/layout/AppShell';
import {
  DocumentFormPanel,
  buildPoSections,
} from '@/components/documents/DocumentFormPanel';
import { FilePreview } from '@/components/documents/FilePreview';
import { ItemGrid } from '@/components/documents/ItemGrid';
import {
  InsufficientDocsBanner,
  MismatchBanner,
} from '@/components/match/MismatchBanner';
import { useDocument } from '@/hooks/useDocuments';
import { useMatch } from '@/hooks/useMatch';
import { matchStatusLabel } from '@/lib/utils';
import { documentItemsToMatchRows, sumDocumentQuantity } from '@/lib/document-items';

export default function PurchaseOrderPage({
  params,
}: {
  params: { poNumber: string };
}) {
  const poNumber = decodeURIComponent(params.poNumber);
  const { data: match, isLoading, error } = useMatch(poNumber);

  const activePo = match?.linkedDocuments.purchaseOrders[0];
  const { data: document, isLoading: documentLoading } = useDocument(activePo?.id);

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

  if (!match?.linkedDocuments.purchaseOrders.length) {
    return (
      <EmptyState
        title="No Purchase Order uploaded"
        description="Upload a PO document to begin reconciliation for this PO number."
      />
    );
  }

  const displayItems =
    match.items.length > 0
      ? match.items
      : document
        ? documentItemsToMatchRows(document.items)
        : [];

  const totalQty =
    match.items.length > 0
      ? match.items.reduce((sum, item) => sum + item.poQty, 0)
      : sumDocumentQuantity(document?.items, 'quantity');

  const itemsLoading = match.items.length === 0 && documentLoading;

  return (
    <div className="space-y-4 p-4">
      {match.status === 'insufficient_documents' && <InsufficientDocsBanner />}
      <MismatchBanner reasons={match.reasons} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DocumentFormPanel
          sections={buildPoSections({
            poNumber,
            poDate: document?.poDate ?? activePo?.date,
            vendorName: document?.vendorName,
            itemCount: document?.items?.length ?? displayItems.length,
            totalQty,
            matchStatus: matchStatusLabel(match.status),
            reasonCount: match.reasons.length,
            grnCount: match.linkedDocuments.grns.length,
            invoiceCount: match.linkedDocuments.invoices.length,
          })}
        />
        <FilePreview
          documentId={activePo?.id}
          mimeType={document?.mimeType}
          fileName={document?.originalFileName}
        />
      </div>

      {itemsLoading ? (
        <LoadingBlock label="Loading PO items…" />
      ) : (
        <ItemGrid items={displayItems} mode="po" />
      )}
    </div>
  );
}
