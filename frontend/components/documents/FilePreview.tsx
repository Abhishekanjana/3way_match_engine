'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Minus, Plus, Loader2 } from 'lucide-react';
import { apiBlob } from '@/lib/api-client';

const PdfInlineViewer = dynamic(
  () =>
    import('@/components/documents/PdfInlineViewer').then((module) => module.PdfInlineViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    ),
  }
);

type PreviewKind = 'pdf' | 'image' | null;

function resolvePreviewKind(
  blobType: string | null,
  mimeType?: string,
  fileName?: string
): PreviewKind {
  const types = [blobType, mimeType].filter(Boolean) as string[];
  const name = fileName?.toLowerCase() ?? '';

  if (types.some((type) => type.includes('pdf')) || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    types.some((type) => type.startsWith('image/')) ||
    /\.(jpe?g|png|gif|webp)$/i.test(name)
  ) {
    return 'image';
  }

  if (blobType === 'application/octet-stream') {
    return 'pdf';
  }

  return null;
}

export function FilePreview({
  documentId,
  mimeType,
  fileName,
}: {
  documentId?: string;
  mimeType?: string;
  fileName?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [blobType, setBlobType] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const previewKind = useMemo(
    () => resolvePreviewKind(blobType, mimeType, fileName),
    [blobType, mimeType, fileName]
  );

  useEffect(() => {
    if (!documentId) {
      setBlobUrl(null);
      setPdfData(null);
      setBlobType(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setPdfData(null);
      setBlobType(null);

      try {
        const blob = await apiBlob(`/documents/${documentId}/file`, controller.signal, {
          preview: true,
        });
        const type = blob.type || null;
        setBlobType(type);

        const kind = resolvePreviewKind(type, mimeType, fileName);

        if (kind === 'pdf') {
          setPdfData(await blob.arrayBuffer());
        } else {
          const objectUrl = URL.createObjectURL(blob);
          blobUrlRef.current = objectUrl;
          setBlobUrl(objectUrl);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Unable to load document preview');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [documentId, fileName, mimeType]);

  async function download() {
    if (!documentId) {
      return;
    }

    try {
      const blob = await apiBlob(`/documents/${documentId}/file`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName ?? 'document';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }

  return (
    <div className="card-surface-white flex h-full min-h-[420px] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-brand-border bg-brand-card px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          <button
            type="button"
            className="rounded border border-brand-border px-2 py-1 hover:bg-white"
            onClick={() => setZoom((value) => Math.max(50, value - 10))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center">{zoom}%</span>
          <button
            type="button"
            className="rounded border border-brand-border px-2 py-1 hover:bg-white"
            onClick={() => setZoom((value) => Math.min(200, value + 10))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          className="rounded p-2 text-brand-muted hover:bg-brand-primary-light"
          onClick={download}
          disabled={!documentId}
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-brand-card/30">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && pdfData && previewKind === 'pdf' && (
          <PdfInlineViewer data={pdfData} zoom={zoom} fileName={fileName} />
        )}

        {!loading && !error && blobUrl && previewKind === 'image' && (
          <div className="flex h-full items-center justify-center overflow-auto p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt={fileName ?? 'Document preview'}
              className="max-h-full max-w-full object-contain"
              style={{ width: `${zoom}%` }}
            />
          </div>
        )}

        {!loading && !error && !pdfData && !blobUrl && previewKind && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <p className="text-sm text-brand-muted">Preview unavailable for this file type.</p>
          </div>
        )}

        {!documentId && !loading && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <p className="text-sm text-brand-muted">No document selected for preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}
