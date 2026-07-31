'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, Package, Receipt, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClientError } from '@/lib/api-client';
import {
  ACCEPTED_UPLOAD_TYPES,
  isAcceptedUploadFile,
  phaseIndex,
  processingTitle,
  UPLOAD_PHASES,
} from '@/lib/upload-progress';
import { cn, matchStatusLabel } from '@/lib/utils';
import { useUploadDocument } from '@/hooks/useMatch';
import { UploadProcessingCard } from '@/components/upload/UploadProcessingCard';
import type { DocumentType, UploadProgressStatus, UploadResponse } from '@/types/api';

const TYPES: Array<{
  value: DocumentType;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    value: 'po',
    label: 'Purchase Order',
    description: 'PO document',
    icon: FileText,
  },
  {
    value: 'invoice',
    label: 'Invoice',
    description: 'Fulfillment',
    icon: Receipt,
  },
  {
    value: 'grn',
    label: 'GRN',
    description: 'Delivery',
    icon: Package,
  },
];

type QueueItem = {
  id: string;
  file: File;
  status: UploadProgressStatus | 'pending' | 'failed';
  step: string;
  error?: string;
};

function createQueueItem(file: File): QueueItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    file,
    status: 'pending',
    step: 'Waiting to upload',
  };
}

function PdfIcon() {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-600 text-[9px] font-bold leading-none text-white">
      PDF
    </span>
  );
}

function QueueFileRow({
  item,
  isProcessing,
  onRemove,
}: {
  item: QueueItem;
  isProcessing: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <PdfIcon />
      <div
        className={cn(
          'flex min-w-0 flex-1 items-start justify-between gap-3 rounded-lg border px-3 py-2.5',
          item.status === 'failed'
            ? 'border-red-200 bg-red-50'
            : item.status === 'completed'
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-brand-border bg-white'
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className="break-words text-sm font-medium leading-snug text-brand-foreground"
            title={item.file.name}
          >
            {item.file.name}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-brand-muted">{item.step}</p>
        </div>
        {!isProcessing && item.status === 'pending' && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="shrink-0 rounded p-1 text-brand-muted hover:bg-brand-card hover:text-brand-foreground"
            aria-label={`Remove ${item.file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function PhaseStepper({ activeStatus }: { activeStatus: UploadProgressStatus | 'pending' | 'failed' }) {
  const activeIndex = phaseIndex(activeStatus);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
      <div className="flex min-w-max items-center gap-2">
      {UPLOAD_PHASES.map((phase, index) => {
        const done = activeIndex >= 0 && index < activeIndex;
        const active = activeIndex >= 0 && index === activeIndex;

        return (
          <div key={phase.status} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-brand-border">→</span>}
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                done && 'bg-emerald-100 text-emerald-700',
                active && 'bg-brand-primary text-white shadow-sm',
                !done && !active && 'bg-brand-card text-brand-muted'
              )}
            >
              {phase.label}
            </span>
          </div>
        );
      })}
      </div>
    </div>
  );
}

export function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const upload = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadResetRef = useRef(upload.reset);
  const prevOpenRef = useRef(open);

  uploadResetRef.current = upload.reset;

  const [documentType, setDocumentType] = useState<DocumentType>('invoice');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [matchNotice, setMatchNotice] = useState<string | null>(null);
  const [activeProgress, setActiveProgress] = useState<UploadProgressStatus | 'pending'>('pending');
  const [activeStep, setActiveStep] = useState('');
  const [lastResult, setLastResult] = useState<UploadResponse | null>(null);

  const resetState = useCallback(() => {
    setQueue([]);
    setIsProcessing(false);
    setDragActive(false);
    setFormError(null);
    setDuplicateNotice(null);
    setMatchNotice(null);
    setActiveProgress('pending');
    setActiveStep('');
    setLastResult(null);
    uploadResetRef.current();
  }, []);

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      resetState();
    }
    prevOpenRef.current = open;
  }, [open, resetState]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(isAcceptedUploadFile);
    const rejected = Array.from(fileList).length - incoming.length;

    if (rejected > 0) {
      setFormError('Only PDF, JPEG, and PNG files are supported.');
    } else {
      setFormError(null);
    }

    if (incoming.length === 0) {
      return;
    }

    setQueue((current) => {
      const existing = new Set(current.map((item) => `${item.file.name}-${item.file.size}`));
      const next = incoming
        .filter((file) => !existing.has(`${file.name}-${file.size}`))
        .map(createQueueItem);

      return [...current, ...next];
    });
  }

  function removeFromQueue(id: string) {
    if (isProcessing) {
      return;
    }

    setQueue((current) => current.filter((item) => item.id !== id));
  }

  function routeForResult(result: UploadResponse, type: DocumentType) {
    if (type === 'invoice') {
      return `/match/${encodeURIComponent(result.poNumber)}/fulfillment`;
    }

    if (type === 'grn') {
      return `/match/${encodeURIComponent(result.poNumber)}/delivery`;
    }

    return `/match/${encodeURIComponent(result.poNumber)}`;
  }

  async function handleUpload() {
    const pending = queue.filter((item) => item.status === 'pending' || item.status === 'failed');

    if (pending.length === 0) {
      setFormError('Add at least one file to upload.');
      return;
    }

    setFormError(null);
    setDuplicateNotice(null);
    setMatchNotice(null);
    setIsProcessing(true);

    let latestResult: UploadResponse | null = null;
    const duplicateMessages: string[] = [];

    for (const item of pending) {
      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: 'uploading', step: 'Uploading file…', error: undefined }
            : entry
        )
      );
      setActiveProgress('uploading');
      setActiveStep('Uploading file…');

      try {
        const result = await upload.mutateAsync({
          file: item.file,
          documentType,
          onProgress: (update) => {
            setActiveProgress(update.status);
            setActiveStep(update.step);
            setQueue((current) =>
              current.map((entry) =>
                entry.id === item.id
                  ? { ...entry, status: update.status, step: update.step }
                  : entry
              )
            );
          },
        });

        latestResult = result;
        setLastResult(result);
        setMatchNotice(`Match status: ${matchStatusLabel(result.matchStatus)}`);

        if (result.duplicateWarnings?.length) {
          duplicateMessages.push(
            ...result.duplicateWarnings.map((warning) => warning.message)
          );
        }

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: 'completed',
                  step: `Match: ${matchStatusLabel(result.matchStatus)}`,
                }
              : entry
          )
        );
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Upload failed';

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: 'failed', step: 'Upload failed', error: message }
              : entry
          )
        );
        setFormError(message);
        setActiveProgress('failed');
        setActiveStep(message);
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(false);
    setActiveProgress('completed');
    setActiveStep(
      latestResult ? `Match: ${matchStatusLabel(latestResult.matchStatus)}` : 'Complete'
    );

    if (duplicateMessages.length > 0) {
      setDuplicateNotice([...new Set(duplicateMessages)].join(' '));
    }

    if (latestResult) {
      onClose();
      router.push(routeForResult(latestResult, documentType));
    }
  }

  const showScanner = isProcessing || queue.some((item) => item.status !== 'pending');
  const currentItem = queue.find(
    (item) => item.status !== 'pending' && item.status !== 'completed' && item.status !== 'failed'
  );
  const displayProgress = isProcessing
    ? currentItem?.status ?? activeProgress
    : queue.find((item) => item.status === 'completed')?.status ?? 'pending';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Documents"
      className="w-full max-w-4xl"
      bodyClassName="p-0"
    >
      <div className="flex flex-col lg:flex-row lg:items-start">
        {/* Left — document type */}
        <aside className="w-full shrink-0 border-b border-brand-border bg-brand-card/30 px-5 py-5 lg:w-[240px] lg:border-b-0 lg:border-r lg:py-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Document Type
          </p>
          <div className="space-y-2.5">
            {TYPES.map((type) => {
              const Icon = type.icon;
              const selected = documentType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setDocumentType(type.value)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border px-3.5 py-3.5 text-left transition',
                    selected
                      ? 'border-brand-primary bg-brand-primary-light shadow-sm ring-1 ring-brand-primary/20'
                      : 'border-brand-border bg-white hover:border-brand-primary/40 hover:bg-white',
                    isProcessing && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Icon
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      selected ? 'text-brand-primary' : 'text-brand-muted'
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-sm font-semibold leading-snug text-brand-foreground">
                      {type.label}
                    </span>
                    <span className="text-xs leading-relaxed text-brand-muted">
                      {type.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right — drop zone / processing */}
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <div className="flex w-full flex-col gap-5 p-5 lg:p-6">
            {!showScanner && (
              <h3 className="text-lg font-semibold tracking-tight text-brand-foreground">
                Add files to upload
              </h3>
            )}

            {showScanner && (
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold tracking-tight text-brand-foreground">
                  {processingTitle(documentType)}
                </h3>
              </div>
            )}

            {!showScanner && (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragActive(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  if (!isProcessing && event.dataTransfer.files.length > 0) {
                    addFiles(event.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition',
                  dragActive
                    ? 'border-brand-primary bg-brand-primary-light/50'
                    : 'border-brand-border/80 bg-brand-card/20 hover:border-brand-primary/60 hover:bg-brand-primary-light/25'
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition',
                    dragActive
                      ? 'bg-brand-primary/15'
                      : 'bg-brand-primary-light group-hover:bg-brand-primary/10'
                  )}
                >
                  <Upload className="h-7 w-7 text-brand-primary" />
                </div>
                <p className="text-sm font-semibold text-brand-foreground">
                  Drag &amp; drop files here
                </p>
                <p className="mt-1.5 text-sm text-brand-muted">
                  or{' '}
                  <span className="font-medium text-brand-primary underline-offset-2 group-hover:underline">
                    click to browse
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {['PDF', 'JPEG', 'PNG'].map((format) => (
                    <span
                      key={format}
                      className="rounded-md border border-brand-border/80 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-muted"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_UPLOAD_TYPES}
              className="hidden"
              disabled={isProcessing}
              onChange={(event) => {
                if (event.target.files?.length) {
                  addFiles(event.target.files);
                }
                event.target.value = '';
              }}
            />

            {isProcessing && (
              <div className="space-y-4">
                <UploadProcessingCard
                  fileName={currentItem?.file.name ?? queue[0]?.file.name}
                  step={activeStep || currentItem?.step}
                />
                <div className="rounded-lg border border-brand-border bg-brand-card/40 px-4 py-3">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Progress
                  </p>
                  <PhaseStepper activeStatus={displayProgress} />
                </div>
              </div>
            )}

            {queue.length > 0 && !isProcessing && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Selected files
                </p>
                {queue.map((item) => (
                  <QueueFileRow
                    key={item.id}
                    item={item}
                    isProcessing={isProcessing}
                    onRemove={removeFromQueue}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width footer — avoids buttons straddling the column divider */}
      <div className="border-t border-brand-border bg-brand-card/30 px-6 py-4">
        {matchNotice && (
          <div className="mb-3 rounded-lg border border-brand-primary/20 bg-brand-primary-light px-3 py-2 text-sm text-brand-foreground">
            {matchNotice}
          </div>
        )}

        {duplicateNotice && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {duplicateNotice} Match status will show duplicate conflict.
          </div>
        )}

        {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-sm font-medium text-brand-muted transition hover:text-brand-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {queue.length > 0 && !isProcessing && (
              <p className="text-center text-xs text-brand-muted sm:text-right">
                {queue.length} file{queue.length === 1 ? '' : 's'} ready
              </p>
            )}

            <Button
              type="button"
              onClick={handleUpload}
              disabled={isProcessing || queue.length === 0}
              className="min-w-[180px] gap-2 px-6 py-2.5 text-sm font-semibold shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : queue.length === 0 ? (
                <>
                  <Upload className="h-4 w-4" />
                  Add files to continue
                </>
              ) : queue.length === 1 ? (
                <>
                  <Upload className="h-4 w-4" />
                  Upload &amp; process
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {queue.length} files
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
