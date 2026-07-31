import type { UploadProgressStatus } from '@/types/api';

export const UPLOAD_PHASES: Array<{ status: UploadProgressStatus | 'pending'; label: string }> = [
  { status: 'uploading', label: 'Uploading' },
  { status: 'queued', label: 'Queued' },
  { status: 'parsing', label: 'Parsing' },
  { status: 'resolving', label: 'Mapping' },
  { status: 'saving', label: 'Saving' },
  { status: 'completed', label: 'Matched' },
];

export function phaseIndex(status: UploadProgressStatus | 'pending' | 'failed'): number {
  if (status === 'failed') {
    return -1;
  }

  if (status === 'pending') {
    return -1;
  }

  return UPLOAD_PHASES.findIndex((phase) => phase.status === status);
}

export const ACCEPTED_UPLOAD_TYPES =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export function isAcceptedUploadFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    name.endsWith('.pdf') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    type === 'application/pdf' ||
    type === 'image/jpeg' ||
    type === 'image/png'
  );
}

export function processingTitle(documentType: 'po' | 'grn' | 'invoice'): string {
  switch (documentType) {
    case 'po':
      return 'Processing Purchase Orders';
    case 'grn':
      return 'Processing GRNs';
    case 'invoice':
      return 'Processing Invoices';
    default:
      return 'Processing Documents';
  }
}
