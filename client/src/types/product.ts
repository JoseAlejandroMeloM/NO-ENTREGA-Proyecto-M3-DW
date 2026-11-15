/** `Product` schema and enums in docs/spec/openapi.yaml. */
export const CATEGORIES = [
  'groceries',
  'beverages',
  'dairy',
  'snacks',
  'cleaning',
  'personal_care',
  'bakery',
  'fruits_vegetables',
  'meat',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNITS = ['unit', 'kg', 'g', 'l', 'ml', 'pack'] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  groceries: 'Groceries',
  beverages: 'Beverages',
  dairy: 'Dairy',
  snacks: 'Snacks',
  cleaning: 'Cleaning',
  personal_care: 'Personal care',
  bakery: 'Bakery',
  fruits_vegetables: 'Fruits & vegetables',
  meat: 'Meat',
  other: 'Other',
};

export const UNIT_LABEL: Record<Unit, string> = { unit: 'Unit', kg: 'kg', g: 'g', l: 'L', ml: 'mL', pack: 'Pack' };

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  unit: Unit;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  lowStock: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPage {
  page: number;
  limit: number;
  total: number;
  data: Product[];
}

export type AdjustmentReason = 'count' | 'damage' | 'other';
export const REASON_LABEL: Record<AdjustmentReason, string> = { count: 'Stock count', damage: 'Damage / loss', other: 'Other' };

export interface StockMovement {
  id: string;
  type: 'adjustment' | 'sale' | 'order_received' | 'void';
  quantity: number;
  stockAfter: number;
  reason: AdjustmentReason | null;
  note: string | null;
  user: { id: string; name: string } | null;
  createdAt: string;
}

export interface MovementPage {
  page: number;
  limit: number;
  total: number;
  data: StockMovement[];
}
