/** `Sale`, `SaleInput` and `DailySummary` in docs/spec/openapi.yaml. */
export type PaymentMethod = 'card' | 'nequi' | 'cash';
export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'nequi', 'cash'];
export const METHOD_LABEL: Record<PaymentMethod, string> = { card: 'Card', nequi: 'Nequi', cash: 'Cash' };

export interface SaleItem {
  product: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number | null;
  change: number | null;
  cashier: { id: string; name: string } | null;
  createdAt: string;
}

export interface SalePage {
  page: number;
  limit: number;
  total: number;
  data: Sale[];
}

export interface DailySummary {
  date: string;
  byMethod: { method: PaymentMethod; total: number; count: number }[];
  grandTotal: number;
  salesCount: number;
}
