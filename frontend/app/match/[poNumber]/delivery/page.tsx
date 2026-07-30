'use client';

import { Suspense } from 'react';
import DeliveryContent from './DeliveryContent';

export default function DeliveryPage(props: { params: { poNumber: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-brand-muted">Loading…</div>}>
      <DeliveryContent params={props.params} />
    </Suspense>
  );
}
