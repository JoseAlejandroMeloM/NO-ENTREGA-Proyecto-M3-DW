import type { Category, Unit } from './product';

/** `PurchaseOrder` schema and `OrderStatus` enum in docs/spec/openapi.yaml. */
export const ORDER_STATUSES = ['pending', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export interface OrderItem {
  catalogItem: string;
  name: string;
  unit: Unit;
  category: Category;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  store: { id: string; name: string };
  distributor: { id: string; name: string };
  items: OrderItem[];
  total: number;
  note: string | null;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string; by: { id: string; name: string }; note: string | null }[];
  rejectReason: string | null;
  receivedAt: string | null;
  rated: boolean;
  createdAt: string;
}

export interface OrderPage {
  page: number;
  limit: number;
  total: number;
  data: PurchaseOrder[];
}
