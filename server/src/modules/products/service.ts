import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { Product, toProductDto } from '../../models/Product';
import { StockMovement } from '../../models/StockMovement';
import { AppError, notFoundError } from '../../utils/errors';
import type { AdjustmentInput, CreateProductInput, ListProductsQuery, MovementsQuery, UpdateProductInput } from './schemas';
import { applyStock, checkLowStock, InsufficientStockError } from './stock';

const duplicateSku = () =>
  new AppError(409, 'CONFLICT', 'A product with this SKU already exists in your store', [
    { path: 'sku', message: 'SKU already used by another product' },
  ]);
const isDuplicate = (err: unknown) => (err as { code?: number }).code === 11000;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findOwn(user: AuthUser, id: string) {
  const product = await Product.findOne({ _id: id, storeId: user.orgId, active: true });
  if (!product) throw notFoundError('Product');
  return product;
}

export async function list(user: AuthUser, { page, limit, q, category, lowStock }: ListProductsQuery) {
  const filter: Record<string, unknown> = { storeId: user.orgId, active: true };
  if (category) filter.category = category;
  if (q) {
    // User text is escaped before it becomes a regex (no ReDoS / operator injection).
    const re = mongoose.trusted({ $regex: escapeRegex(q), $options: 'i' });
    filter.$or = [{ name: re }, { sku: re }];
  }
  if (lowStock !== undefined) {
    filter.$expr = mongoose.trusted(lowStock ? { $lte: ['$stock', '$minStock'] } : { $gt: ['$stock', '$minStock'] });
  }
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ name: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  return { page, limit, total, data: items.map(toProductDto) };
}

export async function get(user: AuthUser, id: string) {
  return toProductDto(await findOwn(user, id));
}

export async function create(user: AuthUser, input: CreateProductInput) {
  const { stock, ...fields } = input;
  let product;
  try {
    // A product created already low does not alert (the user just typed it); it alerts after a restock + drop.
    product = await Product.create({ ...fields, storeId: user.orgId, stock: 0, lowStockNotified: stock <= fields.minStock });
  } catch (err) {
    if (isDuplicate(err)) throw duplicateSku();
    throw err;
  }
  // Initial stock goes through the stock service so it shows up in the movement history.
  if (stock > 0) {
    product = await applyStock({
      storeId: user.orgId,
      productId: product.id,
      delta: stock,
      type: 'adjustment',
      reason: 'count',
      note: 'Initial stock',
      userId: user.id,
    });
  }
  return toProductDto(product);
}

export async function update(user: AuthUser, id: string, input: UpdateProductInput) {
  let product;
  try {
    product = await Product.findOneAndUpdate({ _id: id, storeId: user.orgId, active: true }, input, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (isDuplicate(err)) throw duplicateSku();
    throw err;
  }
  if (!product) throw notFoundError('Product');
  // A new minimum can make the product low (or not low) without any stock change.
  if (input.minStock !== undefined) await checkLowStock(product);
  return toProductDto(product);
}

export async function remove(user: AuthUser, id: string) {
  const res = await Product.updateOne({ _id: id, storeId: user.orgId, active: true }, { active: false });
  if (res.matchedCount === 0) throw notFoundError('Product');
}

export async function adjust(user: AuthUser, id: string, input: AdjustmentInput) {
  try {
    const product = await applyStock({
      storeId: user.orgId,
      productId: id,
      delta: input.quantity,
      type: 'adjustment',
      reason: input.reason,
      note: input.note,
      userId: user.id,
    });
    return toProductDto(product);
  } catch (err) {
    // For a manual adjustment this is bad input, not a conflict (US-11 AC1, QA-06: 400 + stock unchanged).
    if (err instanceof InsufficientStockError) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Stock cannot go below 0', [
        { path: 'quantity', message: `You can remove at most ${err.available}` },
      ]);
    }
    throw err;
  }
}

export async function movements(user: AuthUser, id: string, { page, limit }: MovementsQuery) {
  await findOwn(user, id);
  const filter = { productId: id, storeId: user.orgId };
  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate<{ userId: { _id: mongoose.Types.ObjectId; name: string } | null }>('userId', 'name'),
    StockMovement.countDocuments(filter),
  ]);
  return {
    page,
    limit,
    total,
    data: items.map((m) => ({
      id: m._id.toString(),
      type: m.type,
      quantity: m.quantity,
      stockAfter: m.stockAfter,
      reason: m.reason ?? null,
      note: m.note ?? null,
      user: m.userId ? { id: m.userId._id.toString(), name: m.userId.name } : null,
      createdAt: m.createdAt,
    })),
  };
}
