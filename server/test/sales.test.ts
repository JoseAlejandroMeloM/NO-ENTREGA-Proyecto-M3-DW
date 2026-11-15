import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { Notification } from '../src/models/Notification';
import { Sale } from '../src/models/Sale';
import { StockMovement } from '../src/models/StockMovement';
import { dayRange, todayInBogota } from '../src/modules/sales/time';
import { auth, createEmployee, registerStore } from './helpers';

async function setup() {
  const owner = await registerStore();
  const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
  const mk = async (sku: string, price: number, stock: number, minStock = 0) =>
    (
      await request(app)
        .post('/api/products')
        .set(auth(owner.accessToken))
        .send({ name: `Product ${sku}`, sku, category: 'groceries', unit: 'unit', price, stock, minStock })
    ).body as { id: string };
  const a = await mk('A', 3000, 8);
  const b = await mk('B', 1500, 3);
  return { owner, cashier, a, b };
}

const sell = (token: string, body: Record<string, unknown>) => request(app).post('/api/sales').set(auth(token)).send(body);
const stockOf = async (token: string, id: string) =>
  (await request(app).get(`/api/products/${id}`).set(auth(token))).body.stock as number;

describe('POST /api/sales', () => {
  it('registers a card sale priced by the server, ignoring a fake total', async () => {
    const { cashier, owner, a } = await setup();
    const res = await sell(cashier.token, { items: [{ product: a.id, quantity: 2 }], paymentMethod: 'card', total: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ total: 6000, paymentMethod: 'card', change: null, cashier: { name: 'Employee Test' } });
    expect(res.body.items[0]).toMatchObject({ product: a.id, quantity: 2, unitPrice: 3000, subtotal: 6000 });
    expect(await stockOf(owner.accessToken, a.id)).toBe(6);
    expect(await StockMovement.countDocuments({ type: 'sale', quantity: -2 })).toBe(1);
  });

  it('computes change for cash and rejects too little cash or cash fields on card', async () => {
    const { cashier, a } = await setup();
    const ok = await sell(cashier.token, { items: [{ product: a.id, quantity: 2 }], paymentMethod: 'cash', amountReceived: 10000 });
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({ total: 6000, amountReceived: 10000, change: 4000 });

    const short = await sell(cashier.token, { items: [{ product: a.id, quantity: 2 }], paymentMethod: 'cash', amountReceived: 5000 });
    expect(short.status).toBe(400);
    expect(short.body.error).toMatchObject({ code: 'VALIDATION_ERROR', details: [{ path: 'amountReceived' }] });
    const missingCash = await sell(cashier.token, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'cash' });
    expect(missingCash.status).toBe(400);
    const cardWithCash = await sell(cashier.token, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'card', amountReceived: 5000 });
    expect(cardWithCash.status).toBe(400);
  });

  it('requires a payment method and at least one valid item', async () => {
    const { cashier, a } = await setup();
    expect((await sell(cashier.token, { items: [{ product: a.id, quantity: 1 }] })).status).toBe(400);
    expect((await sell(cashier.token, { items: [], paymentMethod: 'card' })).status).toBe(400);
    const ghost = await sell(cashier.token, { items: [{ product: 'a'.repeat(24), quantity: 1 }], paymentMethod: 'card' });
    expect(ghost.status).toBe(400);
    expect(ghost.body.error.details[0].path).toBe('items.0.product');
  });

  it('rejects the whole sale with 409 when any item exceeds stock, changing nothing (BR1)', async () => {
    const { cashier, owner, a, b } = await setup();
    const res = await sell(cashier.token, {
      items: [
        { product: a.id, quantity: 1 },
        { product: b.id, quantity: 10 },
      ],
      paymentMethod: 'card',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.details[0]).toMatchObject({ path: 'items.1.quantity' });
    expect(await stockOf(owner.accessToken, a.id)).toBe(8);
    expect(await stockOf(owner.accessToken, b.id)).toBe(3);
    expect(await Sale.countDocuments()).toBe(0);
  });

  it('merges repeated lines before checking stock', async () => {
    const { cashier, b } = await setup();
    const res = await sell(cashier.token, {
      items: [
        { product: b.id, quantity: 2 },
        { product: b.id, quantity: 2 },
      ],
      paymentMethod: 'nequi',
    });
    expect(res.status).toBe(409); // 4 > 3 even though each line alone fits
  });

  it('never oversells under concurrent sales and rolls back partial sales', async () => {
    const { owner, cashier, b } = await setup(); // stock 3
    const results = await Promise.all(
      Array.from({ length: 5 }, () => sell(cashier.token, { items: [{ product: b.id, quantity: 1 }], paymentMethod: 'card' })),
    );
    const ok = results.filter((r) => r.status === 201).length;
    expect(results.every((r) => r.status === 201 || r.status === 409)).toBe(true); // never a 500
    expect(ok).toBeLessThanOrEqual(3);
    expect(await stockOf(owner.accessToken, b.id)).toBe(3 - ok);
    expect(await Sale.countDocuments()).toBe(ok);
    expect(await StockMovement.countDocuments({ type: 'sale' })).toBe(ok);
  });

  it('forbids inventory clerks from selling', async () => {
    const { owner, a } = await setup();
    const clerk = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    expect((await sell(clerk.token, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'card' })).status).toBe(403);
  });

  it('runs the low-stock rule after the sale', async () => {
    const owner = await registerStore();
    const p = (
      await request(app)
        .post('/api/products')
        .set(auth(owner.accessToken))
        .send({ name: 'Leche', sku: 'L1', category: 'dairy', unit: 'l', price: 4000, stock: 6, minStock: 5 })
    ).body;
    await sell(owner.accessToken, { items: [{ product: p.id, quantity: 2 }], paymentMethod: 'card' });
    expect(await Notification.countDocuments({ type: 'low_stock' })).toBe(1);
  });

  it('keeps the price snapshot after the product changes', async () => {
    const { owner, cashier, a } = await setup();
    const sale = (await sell(cashier.token, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'card' })).body;
    await request(app).patch(`/api/products/${a.id}`).set(auth(owner.accessToken)).send({ price: 9999, name: 'Renamed' });
    await request(app).delete(`/api/products/${a.id}`).set(auth(owner.accessToken));
    const detail = await request(app).get(`/api/sales/${sale.id}`).set(auth(owner.accessToken));
    expect(detail.body.items[0]).toMatchObject({ name: 'Product A', unitPrice: 3000 });
    expect(detail.body.total).toBe(3000);
  });
});

describe('GET /api/sales', () => {
  it('filters by payment method and scopes cashiers to their own sales', async () => {
    const { owner, cashier, a } = await setup();
    const other = await createEmployee(owner.accessToken, 'store_cashier', 'caja2@tienda.co');
    await sell(cashier.token, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'nequi' });
    await sell(other.token, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'card' });
    await sell(owner.accessToken, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'nequi' });

    const nequi = await request(app).get('/api/sales?paymentMethod=nequi').set(auth(owner.accessToken));
    expect(nequi.body.total).toBe(2);
    expect(nequi.body.data.every((s: { paymentMethod: string }) => s.paymentMethod === 'nequi')).toBe(true);

    const byCashier = await request(app).get(`/api/sales?cashier=${other.id}`).set(auth(owner.accessToken));
    expect(byCashier.body.total).toBe(1);

    // A cashier asking for someone else's sales still only gets their own.
    const own = await request(app).get(`/api/sales?cashier=${other.id}`).set(auth(cashier.token));
    expect(own.body.total).toBe(1);
    expect(own.body.data[0].cashier.id).toBe(cashier.id);
    const otherSale = byCashier.body.data[0].id;
    expect((await request(app).get(`/api/sales/${otherSale}`).set(auth(cashier.token))).status).toBe(404);
  });

  it('filters by Bogota date range', async () => {
    const { owner, a } = await setup();
    await sell(owner.accessToken, { items: [{ product: a.id, quantity: 1 }], paymentMethod: 'card' });
    const today = todayInBogota();
    expect((await request(app).get(`/api/sales?from=${today}&to=${today}`).set(auth(owner.accessToken))).body.total).toBe(1);
    expect((await request(app).get('/api/sales?to=2020-01-01').set(auth(owner.accessToken))).body.total).toBe(0);
    expect((await request(app).get('/api/sales?from=2026-02-30').set(auth(owner.accessToken))).status).toBe(400);
  });

  it('lets inventory read history', async () => {
    const { owner } = await setup();
    const clerk = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    expect((await request(app).get('/api/sales').set(auth(clerk.token))).status).toBe(200);
  });
});

describe('GET /api/sales/summary/daily', () => {
  it('totals per method equal the sum of the day’s sales (QA-12)', async () => {
    const { owner, cashier, a, b } = await setup();
    await sell(cashier.token, { items: [{ product: a.id, quantity: 2 }], paymentMethod: 'card' }); // 6000
    await sell(cashier.token, { items: [{ product: b.id, quantity: 1 }], paymentMethod: 'nequi' }); // 1500
    await sell(owner.accessToken, { items: [{ product: a.id, quantity: 1 }, { product: b.id, quantity: 2 }], paymentMethod: 'cash', amountReceived: 10000 }); // 6000
    // A sale from yesterday (Bogota) must not count.
    const yesterday = new Date(dayRange(todayInBogota()).start.getTime() - 60_000);
    const s = await Sale.findOne({ paymentMethod: 'card' });
    await Sale.create({ storeId: s!.storeId, cashierId: s!.cashierId, items: s!.items, total: 99999, paymentMethod: 'card', createdAt: yesterday });

    const res = await request(app).get('/api/sales/summary/daily').set(auth(owner.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      date: todayInBogota(),
      grandTotal: 13500,
      salesCount: 3,
      byMethod: [
        { method: 'card', total: 6000, count: 1 },
        { method: 'nequi', total: 1500, count: 1 },
        { method: 'cash', total: 6000, count: 1 },
      ],
    });
  });

  it('is owner-only', async () => {
    const { owner, cashier } = await setup();
    const clerk = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    expect((await request(app).get('/api/sales/summary/daily').set(auth(clerk.token))).status).toBe(403);
    expect((await request(app).get('/api/sales/summary/daily').set(auth(cashier.token))).status).toBe(403);
  });
});

describe('Bogota day boundaries', () => {
  it('maps a calendar day to UTC-5', () => {
    const { start, end } = dayRange('2026-11-19');
    expect(start.toISOString()).toBe('2026-11-19T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-20T05:00:00.000Z');
    expect(todayInBogota(new Date('2026-11-20T04:59:00Z'))).toBe('2026-11-19');
  });
});
