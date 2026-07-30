'use client';

import { Suspense } from 'react';
import FulfillmentContent from './FulfillmentContent';

export default function FulfillmentPage(props: { params: { poNumber: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-brand-muted">Loading…</div>}>
      <FulfillmentContent params={props.params} />
    </Suspense>
  );
}
