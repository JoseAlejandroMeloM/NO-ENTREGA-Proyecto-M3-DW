import { Distributor, toDistributorDto } from '../../models/Distributor';
import { Store, toStoreDto } from '../../models/Store';
import { AppError, notFoundError } from '../../utils/errors';

export async function getStore(storeId: string) {
  const store = await Store.findById(storeId);
  if (!store) throw notFoundError('Store');
  return toStoreDto(store);
}

export async function updateStore(storeId: string, changes: Record<string, unknown>) {
  const store = await Store.findByIdAndUpdate(storeId, changes, { new: true, runValidators: true });
  if (!store) throw notFoundError('Store');
  return toStoreDto(store);
}

export async function getDistributor(distributorId: string) {
  const distributor = await Distributor.findById(distributorId);
  if (!distributor) throw notFoundError('Distributor');
  return toDistributorDto(distributor);
}

export async function updateDistributor(distributorId: string, changes: Record<string, unknown>) {
  if (changes.nit) {
    const holder = await Distributor.findOne({ nit: changes.nit }).select('_id');
    if (holder && holder._id.toString() !== distributorId) throw new AppError(409, 'CONFLICT', 'NIT already registered');
  }
  const distributor = await Distributor.findByIdAndUpdate(distributorId, changes, { new: true, runValidators: true });
  if (!distributor) throw notFoundError('Distributor');
  return toDistributorDto(distributor);
}
