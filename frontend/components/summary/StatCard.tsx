import { FileText, Receipt, PackageCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const styles = {
  po: 'border-brand-primary/30 bg-brand-primary-light text-brand-primary',
  invoiced: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  received: 'border-violet-200 bg-violet-50 text-violet-700',
};

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof styles;
}) {
  const icons = {
    po: FileText,
    invoiced: Receipt,
    received: PackageCheck,
  };
  const Icon = icons[tone];

  return (
    <div className={`rounded-lg border p-5 ${styles[tone]}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-brand-foreground">{formatCurrency(value)}</p>
    </div>
  );
}
