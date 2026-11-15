import mongoose from 'mongoose';
import { CatalogItem } from '../../models/CatalogItem';
import { Distributor, toDistributorDto } from '../../models/Distributor';
import { notFoundError } from '../../utils/errors';
import { listFor, nameRegex } from '../catalog/service';
import type { CatalogQuery } from '../catalog/schemas';
import type { CompareQuery, DirectoryQuery } from './schemas';

/** Directory (US-31). `categories` only holds categories with available items, so the filter hides empty ones. */
export async function list({ page, limit, q, category }: DirectoryQuery) {
  const filter: Record<string, unknown> = {};
  if (q) filter.name = nameRegex(q);
  if (category) filter.categories = category;
  const [items, total] = await Promise.all([
    Distributor.find(filter).sort({ ratingAverage: -1, name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit),
    Distributor.countDocuments(filter),
  ]);
  return { page, limit, total, data: items.map(toDistributorDto) };
}

async function findDistributor(id: string) {
  const d = await Distributor.findById(id);
  if (!d) throw notFoundError('Distributor');
  return d;
}

export const get = async (id: string) => toDistributorDto(await findDistributor(id));

/** Public catalog: available items only. */
export async function catalog(id: string, query: CatalogQuery) {
  await findDistributor(id);
  return listFor(id, query, true);
}

/** One row per distributor with its cheapest matching available item (US-31). */
export async function compare({ q, category, sort }: CompareQuery) {
  const filter: Record<string, unknown> = { available: true };
  if (q) filter.name = nameRegex(q);
  if (category) filter.category = category;
  const items = await CatalogItem.find(filter).sort({ price: 1, _id: 1 }).limit(1000);

  const cheapest = new Map<string, (typeof items)[number]>();
  for (const item of items) {
    const key = item.distributorId.toString();
    if (!cheapest.has(key)) cheapest.set(key, item);
  }
  const distributors = await Distributor.find({ _id: mongoose.trusted({ $in: [...cheapest.keys()] }) });

  const rows = distributors.map((d) => {
    const item = cheapest.get(d.id as string)!;
    return {
      distributor: {
        id: d.id as string,
        name: d.name,
        deliveryDays: d.deliveryDays,
        minimumOrder: d.minimumOrder,
        ratingAverage: d.ratingAverage,
        ratingCount: d.ratingCount,
        coverageArea: d.coverageArea,
      },
      item: { id: item.id as string, name: item.name, unit: item.unit, price: item.price },
    };
  });
  const by = {
    price: (a: (typeof rows)[number], b: (typeof rows)[number]) => a.item.price - b.item.price,
    deliveryDays: (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      a.distributor.deliveryDays - b.distributor.deliveryDays || a.item.price - b.item.price,
    rating: (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      b.distributor.ratingAverage - a.distributor.ratingAverage || a.item.price - b.item.price,
  }[sort];
  return { data: rows.sort(by) };
}
