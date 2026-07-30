'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { SkuMaster, SkuMasterInput } from '@/types/api';

const empty: SkuMasterInput = {
  skuErpCode: '',
  name: '',
  eanCode: '',
  hsnCode: '',
  uom: '',
  agreedRate: 0,
  mrp: undefined,
  priceTolerance: 0.05,
};

export function SkuForm({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
}: {
  initialValues?: SkuMaster;
  onSubmit: (values: SkuMasterInput) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const [values, setValues] = useState<SkuMasterInput>({
    ...empty,
    ...initialValues,
    eanCode: initialValues?.eanCode ?? '',
    hsnCode: initialValues?.hsnCode ?? '',
    uom: initialValues?.uom ?? '',
    mrp: initialValues?.mrp ?? undefined,
    priceTolerance: initialValues?.priceTolerance ?? 0.05,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  function updateField<K extends keyof SkuMasterInput>(key: K, value: SkuMasterInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (!values.skuErpCode.trim() || !values.name.trim()) {
      setLocalError('ERP Code and Name are required.');
      return;
    }

    try {
      await onSubmit({
        ...values,
        skuErpCode: values.skuErpCode.trim(),
        name: values.name.trim(),
        eanCode: values.eanCode?.trim() || undefined,
        hsnCode: values.hsnCode?.trim() || undefined,
        uom: values.uom?.trim() || undefined,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="ERP Code *" value={values.skuErpCode} onChange={(value) => updateField('skuErpCode', value)} />
        <Field label="Name *" value={values.name} onChange={(value) => updateField('name', value)} />
        <Field label="EAN Code" value={values.eanCode ?? ''} onChange={(value) => updateField('eanCode', value)} />
        <Field label="HSN Code" value={values.hsnCode ?? ''} onChange={(value) => updateField('hsnCode', value)} />
        <Field label="UOM" value={values.uom ?? ''} onChange={(value) => updateField('uom', value)} />
        <NumberField
          label="Agreed Rate *"
          value={values.agreedRate}
          onChange={(value) => updateField('agreedRate', value ?? 0)}
        />
        <NumberField
          label="MRP"
          value={values.mrp ?? ''}
          onChange={(value) => updateField('mrp', value)}
          optional
        />
        <NumberField
          label="Price Tolerance"
          value={values.priceTolerance ?? 0.05}
          onChange={(value) => updateField('priceTolerance', value ?? 0.05)}
          step="0.01"
        />
      </div>

      {(error || localError) && (
        <p className="text-sm text-red-600">{error ?? localError}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save SKU'}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-brand-muted">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = '1',
  optional = false,
}: {
  label: string;
  value: number | string;
  onChange: (value: number | undefined) => void;
  step?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-brand-muted">{label}</label>
      <input
        type="number"
        step={step}
        min="0"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (optional && next === '') {
            onChange(undefined);
            return;
          }
          onChange(Number(next));
        }}
        className="input-field"
      />
    </div>
  );
}
