/** `ProductStat`, daily series and `RestockSuggestion` in docs/spec/openapi.yaml. */
import type { OrderStatus } from './order';
import type { Category, Unit } from './product';

export type Days = 7 | 30 | 90;

export interface ProductStat {
  product: string;
  name: string;
  units: number;
  revenue: number;
}

export interface BestSellers {
  days: Days;
  byUnits: ProductStat[];
  byRevenue: ProductStat[];
}

export interface DailySales {
  days: Days;
  data: { date: string; total: number; count: number }[];
}

export interface RestockSuggestion {
  product: string;
  name: string;
  sku: string;
  category: Category;
  unit: Unit;
  stock: number;
  minStock: number;
  avgDaily: number;
  daysLeft: number | null;
  leadTimeDays: number;
  suggestedQty: number;
  urgent: boolean;
  bestDistributor: { id: string; name: string; price: number; catalogItem: string } | null;
}

/** `DistributorInsights` schema in docs/spec/openapi.yaml (GET /distributor-insights). */
export interface DistributorInsights {
  range: Days;
  deliveredRevenue: number;
  deliveredOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  topItems: { catalogItem: string; name: string; unit: Unit; quantity: number; revenue: number }[];
  topStores: { store: string; name: string; revenue: number; orders: number }[];
  acceptanceRate: number | null;
  avgDeliveryHours: number | null;
}

/** GET /insights/restock. `count` = products with `urgent: true` (the Restock badge in the sidebar). */
export interface RestockResponse {
  windowDays: number;
  count: number;
  data: RestockSuggestion[];
}
