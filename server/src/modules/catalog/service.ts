import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { CatalogItem, toCatalogItemDto } from '../../models/CatalogItem';
import { Distributor } from '../../models/Distributor';
import { notFoundError } from '../../utils/errors';
import type { CatalogQuery, CreateCatalogItemInput, UpdateCatalogItemInput } from './schemas';

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const nameRegex = (q: string) => mongoose.trusted({ $regex: escapeRegex(q), $options: 'i' });

/** Keeps `Distributor.categories` equal to the categories of its available items (used by the directory). */
async function syncCategories(distributorId: string) {
  const categories = await CatalogItem.distinct('category', { distributorId, available: true });
  await Distributor.updateOne({ _id: distributorId }, { categories: categories.sort() });
}

/** Catalog of one distributor. `onlyAvailable` is true for every store-facing read. */
export async function listFor(distributorId: string, { page, limit, q, category }: CatalogQuery, onlyAvailable: boolean) {
  const filter: Record<string, unknown> = { distributorId };
  if (onlyAvailable) filter.available = true;
  if (category) filter.category = category;
  if (q) filter.name = nameRegex(q);
  const [items, total] = await Promise.all([
    CatalogItem.find(filter).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit),
    CatalogItem.countDocuments(filter),
  ]);
  return { page, limit, total, data: items.map(toCatalogItemDto) };
}

export const listMine = (user: AuthUser, query: CatalogQuery) => listFor(user.orgId, query, false);

export async function create(user: AuthUser, input: CreateCatalogItemInput) {
  const item = await CatalogItem.create({ ...input, distributorId: user.orgId });
  await syncCategories(user.orgId);
  return toCatalogItemDto(item);
}

export async function update(user: AuthUser, id: string, input: UpdateCatalogItemInput) {
  const item = await CatalogItem.findOneAndUpdate({ _id: id, distributorId: user.orgId }, input, {
    new: true,
    runValidators: true,
  });
  if (!item) throw notFoundError('Catalog item');
  await syncCategories(user.orgId);
  return toCatalogItemDto(item);
}

export async function remove(user: AuthUser, id: string) {
  const res = await CatalogItem.deleteOne({ _id: id, distributorId: user.orgId });
  if (res.deletedCount === 0) throw notFoundError('Catalog item');
  await syncCategories(user.orgId);
}
