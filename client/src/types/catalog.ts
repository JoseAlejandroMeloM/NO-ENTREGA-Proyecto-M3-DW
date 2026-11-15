import type { Category, Unit } from './product';

/** `CatalogItem`, `Distributor` and `ComparisonRow` schemas in docs/spec/openapi.yaml. */
export interface CatalogItem {
  id: string;
  distributor: string;
  name: string;
  category: Category;
  unit: Unit;
  price: number;
  available: boolean;
}

export interface Distributor {
  id: string;
  name: string;
  nit: string;
  phone: string;
  coverageArea: string;
  deliveryDays: number;
  minimumOrder: number;
  categories: Category[];
  ratingAverage: number;
  ratingCount: number;
}

export interface Page<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

export interface ComparisonRow {
  distributor: Pick<Distributor, 'id' | 'name' | 'deliveryDays' | 'minimumOrder' | 'ratingAverage' | 'ratingCount' | 'coverageArea'>;
  item: Pick<CatalogItem, 'id' | 'name' | 'unit' | 'price'>;
}

export type CompareSort = 'price' | 'deliveryDays' | 'rating';
