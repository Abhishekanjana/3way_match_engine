'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Minus, Plus, Loader2 } from 'lucide-react';
import { apiBlob } from '@/lib/api-client';

export function FilePreview({ documentId, mimeType, fileName }: {
  documentId?: string;
  mimeType?: string;
  fileName?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);

      try {
        const blob = await apiBlob(`/documents/${documentId}/file`, controller.signal, {
          preview: true,
        });
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
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
  }, [documentId]);

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

  const isPdf = mimeType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = mimeType?.startsWith('image/');

  return (
    <div className="card-surface-white flex h-full min-h-[420px] flex-col">
      <div className="flex items-center justify-between border-b border-brand-border bg-brand-card px-3 py-2">
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

      <div className="flex flex-1 items-center justify-center overflow-auto p-3">
        {loading && <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />}
        {!loading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && blobUrl && isPdf && (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            title={fileName ?? 'Document preview'}
            className="h-[520px] w-full rounded border border-brand-border bg-white"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          />
        )}
        {!loading && !error && blobUrl && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt={fileName ?? 'Document preview'}
            className="max-h-[520px] max-w-full rounded border border-brand-border bg-white object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        )}
        {!loading && !error && blobUrl && !isPdf && !isImage && (
          <p className="text-sm text-brand-muted">Preview unavailable for this file type.</p>
        )}
        {!documentId && !loading && (
          <p className="text-sm text-brand-muted">No document selected for preview.</p>
        )}
      </div>
    </div>
  );
}
