import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { Notification } from '../src/models/Notification';
import { applyStock } from '../src/modules/products/stock';
import { auth, createEmployee, registerDistributor, registerStore } from './helpers';

const product = (overrides: Record<string, unknown> = {}) => ({
  name: 'Arroz Diana 500 g',
  sku: 'ARR-500',
  category: 'groceries',
  unit: 'unit',
  price: 2500,
  cost: 1800,
  stock: 20,
  minStock: 5,
  ...overrides,
});

async function storeWithProduct(overrides: Record<string, unknown> = {}) {
  const owner = await registerStore();
  const res = await request(app).post('/api/products').set(auth(owner.accessToken)).send(product(overrides));
  if (res.status !== 201) throw new Error(`create product failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { owner, product: res.body as { id: string; stock: number } };
}

const adjust = (token: string, id: string, quantity: number, reason = 'count') =>
  request(app).post(`/api/products/${id}/adjustments`).set(auth(token)).send({ quantity, reason });

describe('product CRUD', () => {
  it('lets an inventory clerk create a product in their store', async () => {
    const owner = await registerStore();
    const clerk = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    const res = await request(app).post('/api/products').set(auth(clerk.token)).send(product());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ sku: 'ARR-500', stock: 20, minStock: 5, lowStock: false, active: true });
    const list = await request(app).get('/api/products').set(auth(owner.accessToken));
    expect(list.body.total).toBe(1);
  });

  it('rejects a duplicate SKU in the same store but allows it in another store', async () => {
    const { owner } = await storeWithProduct();
    const dup = await request(app).post('/api/products').set(auth(owner.accessToken)).send(product({ name: 'Otro' }));
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
    const other = await registerStore({ email: 'otra@tienda.co' });
    const ok = await request(app).post('/api/products').set(auth(other.accessToken)).send(product());
    expect(ok.status).toBe(201);
  });

  it('validates input', async () => {
    const owner = await registerStore();
    const res = await request(app)
      .post('/api/products')
      .set(auth(owner.accessToken))
      .send(product({ price: 0, category: 'cars', stock: -1 }));
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['price', 'category', 'stock']));
  });

  it('updates fields but never stock through PATCH', async () => {
    const { owner, product: p } = await storeWithProduct();
    const ok = await request(app).patch(`/api/products/${p.id}`).set(auth(owner.accessToken)).send({ price: 2700 });
    expect(ok.status).toBe(200);
    expect(ok.body.price).toBe(2700);
    const bad = await request(app).patch(`/api/products/${p.id}`).set(auth(owner.accessToken)).send({ stock: 999 });
    expect(bad.status).toBe(400);
  });

  it('forbids cashiers from writing but lets them read', async () => {
    const { owner, product: p } = await storeWithProduct();
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
    const t = auth(cashier.token);
    expect((await request(app).get('/api/products').set(t)).status).toBe(200);
    expect((await request(app).get(`/api/products/${p.id}`).set(t)).status).toBe(200);
    expect((await request(app).post('/api/products').set(t).send(product({ sku: 'X' }))).status).toBe(403);
    expect((await request(app).patch(`/api/products/${p.id}`).set(t).send({ price: 1 })).status).toBe(403);
    expect((await request(app).delete(`/api/products/${p.id}`).set(t)).status).toBe(403);
    expect((await adjust(cashier.token, p.id, 5)).status).toBe(403);
  });

  it('forbids distributor users and hides other stores’ products', async () => {
    const { product: p } = await storeWithProduct();
    const dist = await registerDistributor();
    expect((await request(app).get('/api/products').set(auth(dist.accessToken))).status).toBe(403);
    const other = await registerStore({ email: 'otra@tienda.co' });
    expect((await request(app).get(`/api/products/${p.id}`).set(auth(other.accessToken))).status).toBe(404);
    expect((await adjust(other.accessToken, p.id, 1)).status).toBe(404);
  });

  it('soft-deletes: gone from list and detail, SKU reusable', async () => {
    const { owner, product: p } = await storeWithProduct();
    const t = auth(owner.accessToken);
    expect((await request(app).delete(`/api/products/${p.id}`).set(t)).status).toBe(204);
    expect((await request(app).get('/api/products').set(t)).body.total).toBe(0);
    expect((await request(app).get(`/api/products/${p.id}`).set(t)).status).toBe(404);
    expect((await request(app).delete(`/api/products/${p.id}`).set(t)).status).toBe(404);
    expect((await request(app).post('/api/products').set(t).send(product())).status).toBe(201);
  });
});

describe('product list filters', () => {
  it('searches by name or SKU, filters category and low stock, paginates', async () => {
    const owner = await registerStore();
    const t = auth(owner.accessToken);
    await request(app).post('/api/products').set(t).send(product());
    await request(app).post('/api/products').set(t).send(product({ name: 'Leche Alqueria', sku: 'LEC-1', category: 'dairy', stock: 2 }));
    await request(app).post('/api/products').set(t).send(product({ name: 'Gaseosa', sku: 'GAS-1', category: 'beverages', stock: 5 }));

    const names = async (qs: string) =>
      (await request(app).get(`/api/products?${qs}`).set(t)).body.data.map((p: { name: string }) => p.name);
    expect(await names('q=leche')).toEqual(['Leche Alqueria']);
    expect(await names('q=arr-5')).toEqual(['Arroz Diana 500 g']);
    expect(await names('q=.*')).toEqual([]); // regex characters are literal
    expect(await names('category=beverages')).toEqual(['Gaseosa']);
    expect(await names('lowStock=true')).toEqual(['Gaseosa', 'Leche Alqueria']);
    expect(await names('limit=2&page=2')).toEqual(['Leche Alqueria']);
    expect((await request(app).get('/api/products?limit=101').set(t)).status).toBe(400);
  });
});

describe('stock adjustments and movements', () => {
  it('rejects an adjustment that would go negative and leaves stock unchanged (QA-06)', async () => {
    const { owner, product: p } = await storeWithProduct({ stock: 5 });
    const res = await adjust(owner.accessToken, p.id, -999);
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('quantity');
    expect((await request(app).get(`/api/products/${p.id}`).set(auth(owner.accessToken))).body.stock).toBe(5);
  });

  it('records adjustments with user, reason and resulting stock, newest first', async () => {
    const { owner, product: p } = await storeWithProduct({ stock: 5 });
    const res = await adjust(owner.accessToken, p.id, 10);
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(15);
    await adjust(owner.accessToken, p.id, -2, 'damage');

    const hist = await request(app).get(`/api/products/${p.id}/movements`).set(auth(owner.accessToken));
    expect(hist.status).toBe(200);
    expect(hist.body.total).toBe(3); // initial stock + 2 adjustments
    expect(hist.body.data[0]).toMatchObject({ type: 'adjustment', quantity: -2, reason: 'damage', stockAfter: 13 });
    expect(hist.body.data[0].user.name).toBe('Ana Gomez');
    expect(hist.body.data[2]).toMatchObject({ quantity: 5, note: 'Initial stock' });
  });

  it('rejects quantity 0 and unknown reasons', async () => {
    const { owner, product: p } = await storeWithProduct();
    expect((await adjust(owner.accessToken, p.id, 0)).status).toBe(400);
    expect((await adjust(owner.accessToken, p.id, 1, 'gift')).status).toBe(400);
  });

  it('never goes below 0 under concurrent decrements', async () => {
    const { owner, product: p } = await storeWithProduct({ stock: 5, minStock: 0 });
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        applyStock({ storeId: owner.user.orgId, productId: p.id, delta: -1, type: 'sale', userId: owner.user.id }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
    expect((await request(app).get(`/api/products/${p.id}`).set(auth(owner.accessToken))).body.stock).toBe(0);
  });
});

describe('low-stock alerts', () => {
  it('notifies owner and inventory once when crossing the minimum, again only after a restock', async () => {
    const { owner, product: p } = await storeWithProduct({ stock: 6, minStock: 5 });
    const clerk = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
    const lowAlerts = () => Notification.countDocuments({ type: 'low_stock' });

    await adjust(owner.accessToken, p.id, -2); // 6 → 4: crosses
    expect(await lowAlerts()).toBe(2); // owner + inventory, not the cashier
    await adjust(owner.accessToken, p.id, -1); // 4 → 3: already low
    expect(await lowAlerts()).toBe(2);
    await adjust(owner.accessToken, p.id, 10); // 3 → 13: restocked
    await adjust(owner.accessToken, p.id, -9); // 13 → 4: crosses again
    expect(await lowAlerts()).toBe(4);

    const [n] = (await request(app).get('/api/notifications').set(auth(clerk.token))).body.data;
    expect(n).toMatchObject({ type: 'low_stock', link: `/app/products/${p.id}` });
    expect(n.title).toContain('Arroz Diana');
    expect((await request(app).get('/api/notifications').set(auth(cashier.token))).body.total).toBe(0);
  });

  it('alerts when a new minimum makes the product low', async () => {
    const { owner, product: p } = await storeWithProduct({ stock: 8, minStock: 5 });
    await request(app).patch(`/api/products/${p.id}`).set(auth(owner.accessToken)).send({ minStock: 10 });
    expect(await Notification.countDocuments({ type: 'low_stock' })).toBe(1);
  });

  it('does not alert for a product created already low', async () => {
    await storeWithProduct({ stock: 2, minStock: 5 });
    expect(await Notification.countDocuments({ type: 'low_stock' })).toBe(0);
  });
});
