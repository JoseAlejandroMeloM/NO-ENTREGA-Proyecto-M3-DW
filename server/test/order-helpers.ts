// Shared setup for the order tests (split in two files: each file may register at most 20 accounts per hour).
import request from 'supertest';
import app from '../src/app';
import { auth, registerDistributor, registerStore } from './helpers';

/** Distributor (minimum 100.000, delivery 2 days) with rice at 5.000 and soda at 3.000; a store with rice in stock. */
export async function setup() {
  const dist = await registerDistributor();
  const mk = async (body: Record<string, unknown>) =>
    (await request(app).post('/api/catalog').set(auth(dist.accessToken)).send({ category: 'groceries', unit: 'unit', ...body })).body as { id: string };
  const rice = await mk({ name: 'Arroz Diana 500 g', price: 5000 });
  const soda = await mk({ name: 'Gaseosa 1.5 L', price: 3000, category: 'beverages' });
  const off = await mk({ name: 'Aceite', price: 9000, available: false });
  const store = await registerStore();
  const product = (
    await request(app)
      .post('/api/products')
      .set(auth(store.accessToken))
      .send({ name: 'arroz diana 500 g', sku: 'ARR', category: 'groceries', unit: 'unit', price: 6000, stock: 3 })
  ).body as { id: string };
  return { dist, store, rice, soda, off, product, distributorId: dist.user.orgId };
}

export const order = (token: string, body: Record<string, unknown>) => request(app).post('/api/orders').set(auth(token)).send(body);
export const setStatus = (token: string, id: string, status: string, note?: string) =>
  request(app).patch(`/api/orders/${id}/status`).set(auth(token)).send({ status, note });

export async function deliveredOrder() {
  const s = await setup();
  const created = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 12 }, { catalogItem: s.soda.id, quantity: 20 }] });
  const id = created.body.id as string;
  for (const status of ['accepted', 'shipped', 'delivered']) await setStatus(s.dist.accessToken, id, status);
  return { ...s, id };
}

