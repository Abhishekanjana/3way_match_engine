import { formatCurrency, formatDate } from '@/lib/utils';

type Field = { label: string; value: React.ReactNode };

function Section({ title, fields }: { title: string; fields: Field[] }) {
  return (
    <div className="card-surface border-l-4 border-l-brand-primary">
      <div className="border-b border-brand-border px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs text-brand-muted">{field.label}</p>
            <p className="mt-1 text-sm font-medium text-brand-foreground">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentFormPanel({
  sections,
}: {
  sections: Array<{ title: string; fields: Field[] }>;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Section key={section.title} title={section.title} fields={section.fields} />
      ))}
    </div>
  );
}

export function buildPoSections({
  poNumber,
  poDate,
  vendorName,
  itemCount,
  totalQty,
  matchStatus,
  reasonCount,
  grnCount,
  invoiceCount,
}: {
  poNumber: string;
  poDate?: string;
  vendorName?: string;
  itemCount: number;
  totalQty: number;
  matchStatus: string;
  reasonCount: number;
  grnCount: number;
  invoiceCount: number;
}) {
  return [
    {
      title: 'PO Details',
      fields: [
        { label: 'PO Number', value: poNumber },
        { label: 'PO Date', value: formatDate(poDate) },
        { label: 'Vendor Name', value: vendorName || '—' },
        { label: 'Total SKUs', value: itemCount },
        { label: 'Total Quantity', value: totalQty },
      ],
    },
    {
      title: 'Match Overview',
      fields: [
        { label: 'Overall Status', value: matchStatus },
        { label: 'Reason Count', value: reasonCount },
        { label: 'Linked GRNs', value: grnCount },
        { label: 'Linked Invoices', value: invoiceCount },
      ],
    },
  ];
}

export function buildInvoiceSections({
  invoiceNumber,
  invoiceDate,
  netAmount,
  poNumber,
  poDate,
}: {
  invoiceNumber?: string;
  invoiceDate?: string;
  netAmount?: number;
  poNumber: string;
  poDate?: string;
}) {
  return [
    {
      title: 'Invoice Details',
      fields: [
        { label: 'Invoice Number', value: invoiceNumber || '—' },
        { label: 'Invoice Date', value: formatDate(invoiceDate) },
        { label: 'Net Amount', value: netAmount != null ? formatCurrency(netAmount) : '—' },
      ],
    },
    {
      title: 'PO Details',
      fields: [
        { label: 'PO Number', value: poNumber },
        { label: 'PO Date', value: formatDate(poDate) },
      ],
    },
  ];
}

export function buildGrnSections({
  grnNumber,
  grnDate,
  invoiceNumber,
  invoiceDate,
  poNumber,
  poDate,
}: {
  grnNumber?: string;
  grnDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  poNumber: string;
  poDate?: string;
}) {
  return [
    {
      title: 'GRN Details',
      fields: [
        { label: 'GRN Number', value: grnNumber || '—' },
        { label: 'GRN Date', value: formatDate(grnDate) },
      ],
    },
    {
      title: 'Invoice Details',
      fields: [
        { label: 'Invoice Number', value: invoiceNumber || '—' },
        { label: 'Invoice Date', value: formatDate(invoiceDate) },
      ],
    },
    {
      title: 'PO Details',
      fields: [
        { label: 'PO Number', value: poNumber },
        { label: 'PO Date', value: formatDate(poDate) },
      ],
    },
  ];
}
