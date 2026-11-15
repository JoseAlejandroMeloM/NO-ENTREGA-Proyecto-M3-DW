import Badge from '../Badge';
import { UNIT_LABEL, type Product } from '../../types/product';

/** Stock with its state: red when out, amber at or below the minimum (US-12). */
export default function StockBadge({ product: p }: { product: Pick<Product, 'stock' | 'minStock' | 'unit'> }) {
  const tone = p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success';
  const label = p.stock === 0 ? 'Out of stock' : p.stock <= p.minStock ? 'Low' : 'OK';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums">
        {p.stock} {UNIT_LABEL[p.unit]}
      </span>
      <Badge tone={tone}>{label}</Badge>
    </span>
  );
}
