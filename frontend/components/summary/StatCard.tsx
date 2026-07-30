import { FileText, Receipt, PackageCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const cardStyles = {
  po: {
    shell: 'border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/40',
    iconWrap: 'bg-blue-100 text-brand-primary',
    value: 'text-brand-primary',
  },
  invoiced: {
    shell: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-50/40',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-600',
  },
  received: {
    shell: 'border-violet-100 bg-gradient-to-br from-violet-50 to-violet-50/40',
    iconWrap: 'bg-violet-100 text-violet-600',
    value: 'text-violet-600',
  },
};

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof cardStyles;
}) {
  const icons = {
    po: FileText,
    invoiced: Receipt,
    received: PackageCheck,
  };
  const Icon = icons[tone];
  const style = cardStyles[tone];

  return (
    <div className={`rounded-xl border p-5 ${style.shell}`}>
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${style.iconWrap}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-brand-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${style.value}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
