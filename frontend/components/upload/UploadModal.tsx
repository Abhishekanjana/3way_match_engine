'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClientError } from '@/lib/api-client';
import { useUploadDocument } from '@/hooks/useMatch';
import type { DocumentType } from '@/types/api';

const TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: 'po', label: 'Purchase Order' },
  { value: 'grn', label: 'GRN (Delivery)' },
  { value: 'invoice', label: 'Invoice (Fulfillment)' },
];

type Step = 'idle' | 'processing' | 'done' | 'error';

export function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const upload = useUploadDocument();
  const [documentType, setDocumentType] = useState<DocumentType>('po');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setStep('idle');
      setProgressStep('');
      setError(null);
      upload.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!file) {
      setError('Please select a file.');
      return;
    }

    setError(null);
    setStep('processing');
    setProgressStep('Upload received');

    try {
      const result = await upload.mutateAsync({
        file,
        documentType,
        onProgress: setProgressStep,
      });
      setStep('done');

      const route =
        documentType === 'invoice'
          ? `/match/${encodeURIComponent(result.poNumber)}/fulfillment`
          : documentType === 'grn'
            ? `/match/${encodeURIComponent(result.poNumber)}/delivery`
            : `/match/${encodeURIComponent(result.poNumber)}`;

      onClose();
      router.push(route);
    } catch (err) {
      setStep('error');

      if (err instanceof ApiClientError && err.code === 'DUPLICATE_DOCUMENT') {
        setError(`${err.message}. Open the PO workspace to view the existing document.`);
      } else if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <fieldset className="space-y-2" disabled={upload.isPending}>
          <legend className="text-sm font-medium text-brand-foreground">Document Type</legend>
          {TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2 text-sm text-brand-foreground">
              <input
                type="radio"
                name="documentType"
                value={type.value}
                checked={documentType === type.value}
                onChange={() => setDocumentType(type.value)}
              />
              {type.label}
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="upload-file" className="mb-1 block text-sm font-medium text-brand-foreground">
            File (PDF, JPEG, PNG)
          </label>
          <input
            id="upload-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={upload.isPending}
            className="block w-full text-sm text-brand-muted"
          />
        </div>

        {step === 'processing' && (
          <div className="rounded-lg border border-brand-border bg-brand-primary-light/40 px-3 py-2">
            <p className="text-sm font-medium text-brand-primary">{progressStep || 'Processing…'}</p>
            <p className="mt-1 text-xs text-brand-muted">
              File uploaded. AI parsing runs in the background — you can keep this window open.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={upload.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending ? 'Processing…' : 'Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
