import mongoose from 'mongoose';
import { Product, type ProductDoc } from '../../models/Product';
import { StockMovement, type MovementType } from '../../models/StockMovement';
import { AppError, notFoundError } from '../../utils/errors';
import { notify } from '../notifications/service';

export interface StockChange {
  storeId: string;
  productId: string;
  delta: number; // signed
  type: MovementType;
  userId: string;
  reason?: 'count' | 'damage' | 'other';
  note?: string;
  reference?: string;
}

/** Thrown when a change would leave stock negative. Sales answer 409; adjustments turn it into a 400. */
export class InsufficientStockError extends AppError {
  constructor(public readonly available: number) {
    super(409, 'INSUFFICIENT_STOCK', `Not enough stock (available: ${available})`);
  }
}

/**
 * The only way stock changes (adjustments now; sales, received orders and voids later).
 * Conditional atomic update: the decrement only matches if enough stock is left, so two
 * concurrent sales can never take stock below 0 — no read-then-write race.
 */
export async function applyStock(change: StockChange): Promise<ProductDoc> {
  const { storeId, productId, delta } = change;
  const filter = {
    _id: productId,
    storeId,
    active: true,
    // sanitizeFilter is on: server-built operators must be marked trusted.
    ...(delta < 0 ? { stock: mongoose.trusted({ $gte: -delta }) } : {}),
  };
  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: delta } }, { new: true });
  if (!product) {
    const existing = await Product.findOne({ _id: productId, storeId, active: true });
    if (!existing) throw notFoundError('Product');
    throw new InsufficientStockError(existing.stock);
  }

  await recordMovement(change, product.stock);
  await checkLowStock(product);
  return product;
}

/** Stock is the source of truth; if the history insert fails, retry once and log instead of failing the sale. */
async function recordMovement(change: StockChange, stockAfter: number) {
  const doc = {
    storeId: change.storeId,
    productId: change.productId,
    type: change.type,
    quantity: change.delta,
    stockAfter,
    reason: change.reason,
    note: change.note,
    reference: change.reference,
    userId: change.userId,
  };
  try {
    await StockMovement.create(doc);
  } catch {
    try {
      await StockMovement.create(doc);
    } catch (err) {
      console.error('Stock movement not recorded', { productId: change.productId, err: (err as Error).message });
    }
  }
}

/**
 * Low-stock rule (US-12, BR3): notify owner + inventory once when stock is at or below the minimum,
 * and again only after it went back above. The flag flip is atomic, so concurrent sales notify once.
 */
export async function checkLowStock(product: ProductDoc) {
  if (product.stock <= product.minStock) {
    const flipped = await Product.updateOne(
      { _id: product._id, lowStockNotified: false },
      { lowStockNotified: true },
    );
    if (flipped.modifiedCount === 1) {
      await notify(
        { orgId: product.storeId.toString(), roles: ['store_owner', 'store_inventory'] },
        {
          type: 'low_stock',
          title: `Low stock: ${product.name}`,
          body: `${product.stock} ${product.unit} left (minimum ${product.minStock})`,
          link: `/app/products/${product._id.toString()}`,
        },
      );
    }
  } else if (product.lowStockNotified) {
    await Product.updateOne({ _id: product._id }, { lowStockNotified: false });
  }
}
