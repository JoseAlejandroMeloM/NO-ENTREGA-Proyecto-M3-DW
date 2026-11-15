import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { auth, createEmployee, distributorOwnerInput, registerDistributor, registerStore } from './helpers';

const item = (overrides: Record<string, unknown> = {}) => ({
  name: 'Arroz Diana 500 g',
  category: 'groceries',
  unit: 'unit',
  price: 2200,
  ...overrides,
});

/** A distributor with its own NIT/email; `profile` overrides company fields (deliveryDays, name…). */
async function distributor(n: number, profile: Record<string, unknown> = {}) {
  const base = distributorOwnerInput().distributor;
  return registerDistributor({
    email: `d${n}@distri.co`,
    distributor: { ...base, name: `Distri ${n}`, nit: `90012345${n}-1`, ...profile },
  });
}

async function addItem(token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app).post('/api/catalog').set(auth(token)).send(item(overrides));
  if (res.status !== 201) throw new Error(`create item failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { id: string; distributor: string };
}

describe('catalog management (distributor side)', () => {
  it('lets a distributor owner create an item in their own catalog', async () => {
    const owner = await registerDistributor();
    const res = await request(app).post('/api/catalog').set(auth(owner.accessToken)).send(item());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ distributor: owner.user.orgId, price: 2200, available: true });
  });

  it('rejects store users and staff writes, lets staff read', async () => {
    const store = await registerStore();
    expect((await request(app).post('/api/catalog').set(auth(store.accessToken)).send(item())).status).toBe(403);

    const owner = await registerDistributor();
    const created = await addItem(owner.accessToken);
    const staff = await createEmployee(owner.accessToken, 'distributor_staff', 'staff@distri.co');
    const patch = await request(app).patch(`/api/catalog/${created.id}`).set(auth(staff.token)).send({ price: 1 });
    expect(patch.status).toBe(403);
    const list = await request(app).get('/api/catalog').set(auth(staff.token));
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
  });

  it("returns 404 for another distributor's item", async () => {
    const a = await distributor(1);
    const b = await distributor(2);
    const created = await addItem(a.accessToken);
    const res = await request(app).patch(`/api/catalog/${created.id}`).set(auth(b.accessToken)).send({ price: 1 });
    expect(res.status).toBe(404);
    expect((await request(app).delete(`/api/catalog/${created.id}`).set(auth(b.accessToken))).status).toBe(404);
  });

  it('validates input', async () => {
    const owner = await registerDistributor();
    const res = await request(app)
      .post('/api/catalog')
      .set(auth(owner.accessToken))
      .send(item({ price: 0, category: 'cars' }));
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['price', 'category']));
  });
});

describe('directory, profile and comparison (store side)', () => {
  it('filters the directory by category of available items and blocks cashiers', async () => {
    const a = await distributor(1);
    const b = await distributor(2);
    await addItem(a.accessToken, { name: 'Gaseosa', category: 'beverages' });
    const hidden = await addItem(b.accessToken, { name: 'Jugo', category: 'beverages', available: false });
    await addItem(b.accessToken);

    const store = await registerStore();
    const res = await request(app).get('/api/distributors?category=beverages').set(auth(store.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.map((d: { name: string }) => d.name)).toEqual(['Distri 1']);

    // Making the item available puts the distributor in the category.
    await request(app).patch(`/api/catalog/${hidden.id}`).set(auth(b.accessToken)).send({ available: true });
    const again = await request(app).get('/api/distributors?category=beverages').set(auth(store.accessToken));
    expect(again.body.total).toBe(2);

    const cashier = await createEmployee(store.accessToken, 'store_cashier', 'caja@tienda.co');
    expect((await request(app).get('/api/distributors').set(auth(cashier.token))).status).toBe(403);
  });

  it('shows a profile with only available items', async () => {
    const d = await distributor(1);
    await addItem(d.accessToken);
    await addItem(d.accessToken, { name: 'Panela', available: false });
    const store = await registerStore();
    const profile = await request(app).get(`/api/distributors/${d.user.orgId}`).set(auth(store.accessToken));
    expect(profile.body).toMatchObject({ name: 'Distri 1', deliveryDays: 2, minimumOrder: 100000 });
    const catalog = await request(app).get(`/api/distributors/${d.user.orgId}/catalog`).set(auth(store.accessToken));
    expect(catalog.body.data.map((i: { name: string }) => i.name)).toEqual(['Arroz Diana 500 g']);
    const missing = await request(app).get('/api/distributors/0123456789abcdef01234567').set(auth(store.accessToken));
    expect(missing.status).toBe(404);
  });

  it('compares "arroz": one row per distributor with its lowest price, sortable', async () => {
    const a = await distributor(1, { deliveryDays: 5 });
    const b = await distributor(2, { deliveryDays: 1 });
    await addItem(a.accessToken, { name: 'Arroz Diana 500 g', price: 2300 });
    await addItem(a.accessToken, { name: 'Arroz Roa 1 kg', price: 2100 });
    await addItem(b.accessToken, { name: 'ARROZ blanco', price: 2400 });
    await addItem(b.accessToken, { name: 'Arroz barato', price: 1000, available: false });
    const store = await registerStore();

    const byPrice = await request(app).get('/api/distributors/compare?q=arroz').set(auth(store.accessToken));
    expect(byPrice.status).toBe(200);
    expect(byPrice.body.data.map((r: { distributor: { name: string }; item: { price: number } }) => [r.distributor.name, r.item.price])).toEqual([
      ['Distri 1', 2100],
      ['Distri 2', 2400],
    ]);
    const byDelivery = await request(app).get('/api/distributors/compare?q=arroz&sort=deliveryDays').set(auth(store.accessToken));
    expect(byDelivery.body.data[0].distributor.name).toBe('Distri 2');

    const none = await request(app).get('/api/distributors/compare').set(auth(store.accessToken));
    expect(none.status).toBe(400);
  });

  it('names the cheapest distributor in restock suggestions and uses its delivery days', async () => {
    const a = await distributor(1, { deliveryDays: 4 });
    const b = await distributor(2, { deliveryDays: 6 });
    await addItem(a.accessToken, { name: 'Arroz Diana 500 g x 25', price: 2300 });
    await addItem(b.accessToken, { name: 'arroz diana 500 g', price: 2000 });
    await addItem(a.accessToken, { name: 'Arroz Diana 500 g', price: 100, category: 'beverages' }); // wrong category
    const store = await registerStore();
    await request(app)
      .post('/api/products')
      .set(auth(store.accessToken))
      .send({ name: 'Arroz Diana 500 g', sku: 'A', category: 'groceries', unit: 'unit', price: 2500, stock: 10 });
    const res = await request(app).get('/api/insights/restock').set(auth(store.accessToken));
    expect(res.body.data[0]).toMatchObject({
      bestDistributor: { name: 'Distri 2', price: 2000 },
      leadTimeDays: 6,
    });
  });
});
