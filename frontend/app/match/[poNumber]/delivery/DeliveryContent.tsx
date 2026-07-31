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
  buildGrnSections,
} from '@/components/documents/DocumentFormPanel';
import { FilePreview } from '@/components/documents/FilePreview';
import { ItemGrid } from '@/components/documents/ItemGrid';
import {
  InsufficientDocsBanner,
  MismatchBanner,
} from '@/components/match/MismatchBanner';
import { useDocument } from '@/hooks/useDocuments';
import { useMatch } from '@/hooks/useMatch';
import { documentSubTabStatus } from '@/lib/utils';

export default function DeliveryContent({
  params,
}: {
  params: { poNumber: string };
}) {
  const poNumber = decodeURIComponent(params.poNumber);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: match, isLoading, error } = useMatch(poNumber);

  const grns = useMemo(
    () => match?.linkedDocuments.grns ?? [],
    [match?.linkedDocuments.grns]
  );
  const docParam = searchParams.get('doc');
  const activeId = docParam ?? grns[0]?.id;
  const activeGrn = grns.find((grn) => grn.id === activeId) ?? grns[0];

  const { data: document } = useDocument(activeGrn?.id);
  const { data: poDocument } = useDocument(match?.linkedDocuments.purchaseOrders[0]?.id);
  const firstInvoice = match?.linkedDocuments.invoices[0];

  useEffect(() => {
    const firstId = grns[0]?.id;
    if (firstId && !docParam) {
      router.replace(
        `/match/${encodeURIComponent(poNumber)}/delivery?doc=${firstId}`,
        { scroll: false }
      );
    }
  }, [grns, docParam, poNumber, router]);

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

  if (grns.length === 0) {
    return (
      <EmptyState
        title="No GRNs uploaded"
        description="Upload a GRN document to view Delivery details."
      />
    );
  }

  return (
    <div className="space-y-4">
      {match?.status === 'insufficient_documents' && <InsufficientDocsBanner />}
      <MismatchBanner reasons={match?.reasons ?? []} />

      <SubTabPills
        prefix="GRN"
        items={grns.map((grn) => ({
          id: grn.id,
          label: grn.number,
          status: documentSubTabStatus(grn.number, match?.reasons ?? []),
        }))}
        activeId={activeGrn?.id}
        onSelect={(id) =>
          router.push(`/match/${encodeURIComponent(poNumber)}/delivery?doc=${id}`, {
            scroll: false,
          })
        }
      />

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        <DocumentFormPanel
          sections={buildGrnSections({
            grnNumber: document?.grnNumber ?? activeGrn?.number,
            grnDate: document?.grnDate ?? activeGrn?.date,
            invoiceNumber: firstInvoice?.number,
            invoiceDate: firstInvoice?.date,
            poNumber,
            poDate: poDocument?.poDate ?? match?.linkedDocuments.purchaseOrders[0]?.date,
          })}
        />
        <FilePreview
          documentId={activeGrn?.id}
          mimeType={document?.mimeType}
          fileName={document?.originalFileName}
        />
      </div>

      <div className="px-4 pb-4">
        <ItemGrid items={match?.items ?? []} mode="grn" />
      </div>
    </div>
  );
}
