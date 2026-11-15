/** `ProductStat`, daily series and `RestockSuggestion` in docs/spec/openapi.yaml. */
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
  bestDistributor: { id: string; name: string; price: number } | null;
}
