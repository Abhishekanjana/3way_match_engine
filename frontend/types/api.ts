export type MatchStatus =
  | 'insufficient_documents'
  | 'mismatch'
  | 'partially_matched'
  | 'matched';

export type DocumentType = 'po' | 'grn' | 'invoice';

export type HighlightedField = 'unitPrice' | 'unitMrp' | 'poQty' | 'grnQty' | 'invoiceQty';

export type SkuMaster = {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode?: string | null;
  hsnCode?: string | null;
  uom?: string | null;
  agreedRate: number;
  mrp?: number | null;
  priceTolerance?: number;
  aliases?: string[];
};

export type MatchReason = {
  code: string;
  message: string;
  level: 'hard' | 'soft' | 'info';
};

export type MatchItemRow = {
  matchKey: string;
  description: string;
  itemCode: string;
  skuMaster: SkuMaster | null;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  unitRate: number | null;
  mrp: number | null;
  grossAmount: number | null;
  reasons: string[];
  highlightedFields: HighlightedField[];
  isFullyReconciled?: boolean;
};

export type DocumentRef = {
  id: string;
  number: string;
  date: string;
  type: DocumentType;
  createdAt?: string;
};

export type MatchResponse = {
  poNumber: string;
  status: MatchStatus;
  reasons: MatchReason[];
  linkedDocuments: {
    purchaseOrders: DocumentRef[];
    grns: DocumentRef[];
    invoices: DocumentRef[];
  };
  items: MatchItemRow[];
};

export type SummaryRow = {
  documentType: 'Original PO' | 'Invoice' | 'GRN';
  documentNo: string;
  documentId?: string;
  date: string;
  quantity: number;
  cumulativeInvoice: number;
  cumulativeGrn: number;
  pendingDelivery: number;
};

export type SummaryResponse = {
  poNumber: string;
  poAmount: number;
  totalInvoiced: number;
  totalReceived: number;
  rows: SummaryRow[];
  currentStatus: {
    remainingQty: number;
    cumulativeInvoiceQty: number;
    cumulativeGrnQty: number;
    pendingDelivery: number;
  };
};

export type DocumentItem = {
  itemCode: string;
  description?: string;
  quantity?: number;
  receivedQuantity?: number;
  unitRate?: number | null;
  mrp?: number | null;
  skuMaster?: string | SkuMaster | null;
};

export type StoredDocument = {
  id: string;
  _id?: string;
  documentType: DocumentType;
  poNumber: string;
  poDate?: string;
  poNumberRef?: string;
  vendorName?: string;
  grnNumber?: string;
  grnDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: DocumentItem[];
  originalFileName?: string;
  mimeType?: string;
  createdAt?: string;
};

export type UploadResponse = {
  documentId: string;
  documentType: DocumentType;
  poNumber: string;
  duplicateWarnings: Array<{ code: string; message: string }>;
  matchStatus: MatchStatus;
  matchReasons: MatchReason[];
  document: StoredDocument;
};

export type UploadJobAccepted = {
  jobId: string;
  status: string;
  step: string;
};

export type UploadJobStatus = {
  jobId: string;
  status: 'queued' | 'parsing' | 'resolving' | 'saving' | 'matching' | 'completed' | 'failed';
  step: string;
  result?: UploadResponse;
  error?: { code: string; message: string };
};

export type UploadProgressStatus = UploadJobStatus['status'] | 'uploading';

export type UploadProgressUpdate = {
  status: UploadProgressStatus;
  step: string;
};

export type MatchAuditStep = {
  step: string;
  status: string;
  message: string;
  at: string;
};

export type MatchAuditResponse = {
  poNumber: string;
  steps: MatchAuditStep[];
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type LoginResponse = {
  token: string;
};

export type SkuMasterInput = {
  skuErpCode: string;
  name: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate: number;
  mrp?: number;
  priceTolerance?: number;
  aliases?: string[];
};
