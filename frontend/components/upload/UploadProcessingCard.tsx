'use client';

import { Loader2 } from 'lucide-react';

function FileTypeBadge({ fileName }: { fileName?: string }) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf';
  const label = isPdf ? 'PDF' : ext?.slice(0, 3).toUpperCase() ?? 'DOC';

  return (
    <span
      className={
        isPdf
          ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-600 text-[10px] font-bold text-white'
          : 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-primary text-[10px] font-bold text-white'
      }
    >
      {label}
    </span>
  );
}

export function UploadProcessingCard({
  fileName,
  step,
}: {
  fileName?: string;
  step?: string;
}) {
  return (
    <div className="rounded-xl border border-brand-primary/20 bg-gradient-to-br from-white to-brand-primary-light/25 p-5">
      <div className="flex items-start gap-4">
        <FileTypeBadge fileName={fileName} />
        <div className="min-w-0 flex-1">
          <p
            className="break-words text-base font-semibold leading-snug text-brand-foreground"
            title={fileName}
          >
            {fileName ?? 'Processing document…'}
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-brand-muted">
            {step ?? 'Please wait while we process your file'}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-light">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
