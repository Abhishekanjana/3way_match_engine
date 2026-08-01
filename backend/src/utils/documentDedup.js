function normalizeDocumentNumber(value) {
  return String(value ?? '').trim().toLowerCase();
}

function documentCreatedAt(doc) {
  const createdAt = doc?.createdAt ? new Date(doc.createdAt) : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  return createdAt.getTime();
}

/**
 * Keep the earliest-created document per invoice number (case-insensitive).
 * Later uploads with the same number are stored in DB but excluded from match/summary counts.
 */
function dedupeInvoicesByNumber(invoices = []) {
  const sorted = [...invoices].sort(
    (a, b) => documentCreatedAt(a) - documentCreatedAt(b)
  );

  const unique = [];
  const duplicates = [];
  const seen = new Set();

  for (const invoice of sorted) {
    const key = normalizeDocumentNumber(invoice.invoiceNumber);

    if (!key) {
      unique.push(invoice);
      continue;
    }

    if (seen.has(key)) {
      duplicates.push(invoice);
      continue;
    }

    seen.add(key);
    unique.push(invoice);
  }

  return { unique, duplicates };
}

export { dedupeInvoicesByNumber, normalizeDocumentNumber };
