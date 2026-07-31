'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

type PdfInlineViewerProps = {
  data: ArrayBuffer;
  zoom: number;
  fileName?: string;
};

export function PdfInlineViewer({ data, zoom, fileName }: PdfInlineViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    container.replaceChildren();

    async function renderPdf() {
      setRendering(true);
      setError(null);
      setPageCount(0);

      const mount = containerRef.current;
      if (!mount) {
        return;
      }

      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjs.getDocument({ data: data.slice(0) });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          return;
        }

        setPageCount(pdf.numPages);

        const containerWidth = mount.clientWidth || 640;
        const scaleBase = Math.min(Math.max(containerWidth / 612, 0.75), 1.4);
        const scale = scaleBase * (zoom / 100);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);

          if (cancelled) {
            return;
          }

          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className =
            'mx-auto mb-4 block max-w-full rounded border border-brand-border bg-white shadow-sm';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${fileName ?? 'Document'} page ${pageNumber}`);

          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Unable to create canvas context');
          }

          mount.appendChild(canvas);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to render PDF preview');
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [data, zoom, fileName]);

  return (
    <div className="relative h-full min-h-0">
      {rendering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-card/40">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-center text-sm text-red-600">{error}</p>
        </div>
      )}

      {!error && pageCount > 0 && !rendering && (
        <p className="sticky top-0 z-[1] border-b border-brand-border bg-white/95 px-3 py-1.5 text-xs text-brand-muted">
          {pageCount} page{pageCount === 1 ? '' : 's'}
        </p>
      )}

      <div ref={containerRef} className="h-full overflow-auto p-3" />
    </div>
  );
}
