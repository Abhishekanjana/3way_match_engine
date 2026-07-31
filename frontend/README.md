# Three-Way Match Engine — Frontend

Next.js App Router UI for PO / GRN / Invoice reconciliation.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **TanStack Query v5** — server state (match, summary, documents, SKU master)
- **Local React state** — tab selection, upload modal, sub-tab pills

## Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`. Backend must be running at `http://localhost:5000`.

## Environment

```env
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:5000
```

The frontend proxies `/api/*` to the backend via `next.config.mjs` rewrites, avoiding CORS issues for file preview and blob downloads.

## Routes

| Route | Screen |
|---|---|
| `/login` | Mock auth |
| `/dashboard` | PO list + upload |
| `/match/[poNumber]` | Purchase Order tab |
| `/match/[poNumber]/fulfillment` | Fulfillment (Invoices) |
| `/match/[poNumber]/delivery` | Delivery (GRNs) |
| `/match/[poNumber]/summary` | Summary |
| `/masters` | SKU Master CRUD |

## State management

TanStack Query caches API responses and invalidates after upload/SKU changes. No Redux — backend is the source of truth for match logic.


