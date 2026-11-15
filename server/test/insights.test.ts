import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { restockPlan } from '../src/modules/insights/restock';
import { Sale } from '../src/models/Sale';
import { dayRange, todayInBogota } from '../src/modules/sales/time';
import { auth, createEmployee, registerStore } from './helpers';

const DAY = 24 * 60 * 60 * 1000;
/** Noon (Bogota) `daysAgo` days before today. */
const daysAgo = (n: number) => new Date(dayRange(todayInBogota()).start.getTime() - n * DAY + 12 * 3600_000);

async function setup() {
  const owner = await registerStore();
  const mk = async (name: string, sku: string, price: number, stock: number, minStock = 5) =>
    (
      await request(app)
        .post('/api/products')
        .set(auth(owner.accessToken))
        .send({ name, sku, category: 'groceries', unit: 'unit', price, stock, minStock })
    ).body as { id: string; name: string; sku: string };
  const arroz = await mk('Arroz', 'A', 2500, 10);
  const leche = await mk('Leche', 'L', 4000, 100);
  const caviar = await mk('Caviar', 'C', 90000, 3, 1);
  const quieto = await mk('Quieto', 'Q', 1000, 2); // never sold, low stock
  /** Insert a historical sale directly (the API always stamps "now"). */
  const sale = async (when: Date, lines: [typeof arroz, number, number][]) => {
    const items = lines.map(([p, qty, price]) => ({ productId: p.id, name: p.name, sku: p.sku, quantity: qty, unitPrice: price, subtotal: qty * price }));
    await Sale.create({
      storeId: owner.user.orgId,
      cashierId: owner.user.id,
      items,
      total: items.reduce((s, i) => s + i.subtotal, 0),
      paymentMethod: 'card',
      createdAt: when,
    });
  };
  return { owner, arroz, leche, caviar, quieto, sale };
}

describe('BR4 restock rule (pure)', () => {
  it('matches the spec scenario: avgDaily 2 → 5 days left, suggested 23', () => {
    expect(restockPlan({ stock: 10, minStock: 5, unitsLast30: 60, leadTimeDays: 2 })).toEqual({
      avgDaily: 2,
      daysLeft: 5,
      urgent: true,
      suggestedQty: 23,
    });
  });
  it('has no prediction without sales and never suggests a negative quantity', () => {
    expect(restockPlan({ stock: 50, minStock: 5, unitsLast30: 0, leadTimeDays: 3 })).toEqual({
      avgDaily: 0,
      daysLeft: null,
      urgent: false,
      suggestedQty: 0,
    });
    expect(restockPlan({ stock: 2, minStock: 5, unitsLast30: 0, leadTimeDays: 3 }).urgent).toBe(true); // low stock
  });
  it('is not urgent with plenty of days left', () => {
    const plan = restockPlan({ stock: 100, minStock: 5, unitsLast30: 30, leadTimeDays: 3 });
    expect(plan).toMatchObject({ avgDaily: 1, daysLeft: 100, urgent: false, suggestedQty: 0 });
  });
});

describe('GET /api/insights/best-sellers', () => {
  it('ranks by units and by revenue within the range', async () => {
    const { owner, arroz, leche, caviar, sale } = await setup();
    await sale(daysAgo(1), [[arroz, 10, 2500], [leche, 3, 4000]]);
    await sale(daysAgo(3), [[arroz, 5, 2500], [caviar, 1, 90000]]);
    await sale(daysAgo(20), [[leche, 50, 4000]]); // outside 7 days, inside 30

    const week = await request(app).get('/api/insights/best-sellers?days=7').set(auth(owner.accessToken));
    expect(week.status).toBe(200);
    expect(week.body.byUnits.map((s: { name: string }) => s.name)).toEqual(['Arroz', 'Leche', 'Caviar']);
    expect(week.body.byUnits[0]).toMatchObject({ product: arroz.id, units: 15, revenue: 37500 });
    expect(week.body.byRevenue.map((s: { name: string }) => s.name)).toEqual(['Caviar', 'Arroz', 'Leche']);

    const month = await request(app).get('/api/insights/best-sellers').set(auth(owner.accessToken)); // default 30
    expect(month.body.byUnits[0]).toMatchObject({ name: 'Leche', units: 53 });
  });

  it('returns at most 10 products', async () => {
    const owner = await registerStore();
    const lines: { id: string; name: string; sku: string }[] = [];
    for (let i = 0; i < 12; i++) {
      lines.push(
        (
          await request(app)
            .post('/api/products')
            .set(auth(owner.accessToken))
            .send({ name: `P${i}`, sku: `S${i}`, category: 'other', unit: 'unit', price: 100, stock: 50 })
        ).body,
      );
    }
    await request(app)
      .post('/api/sales')
      .set(auth(owner.accessToken))
      .send({ items: lines.map((p, i) => ({ product: p.id, quantity: i + 1 })), paymentMethod: 'card' });
    const res = await request(app).get('/api/insights/best-sellers?days=7').set(auth(owner.accessToken));
    expect(res.body.byUnits).toHaveLength(10);
    expect(res.body.byUnits[0]).toMatchObject({ name: 'P11', units: 12 });
  });

  it('validates the range and forbids cashiers', async () => {
    const { owner } = await setup();
    expect((await request(app).get('/api/insights/best-sellers?days=15').set(auth(owner.accessToken))).status).toBe(400);
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
    for (const path of ['best-sellers', 'daily-sales', 'restock']) {
      expect((await request(app).get(`/api/insights/${path}`).set(auth(cashier.token))).status).toBe(403);
    }
    const clerk = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    expect((await request(app).get('/api/insights/restock').set(auth(clerk.token))).status).toBe(200);
  });

  it('only counts the caller’s store', async () => {
    const { arroz, sale } = await setup();
    await sale(daysAgo(1), [[arroz, 10, 2500]]);
    const other = await registerStore({ email: 'otra@tienda.co' });
    const res = await request(app).get('/api/insights/best-sellers?days=7').set(auth(other.accessToken));
    expect(res.body.byUnits).toEqual([]);
  });
});

describe('GET /api/insights/daily-sales', () => {
  it('returns one point per Bogota day, zero-filled, oldest first', async () => {
    const { owner, arroz, sale } = await setup();
    await sale(daysAgo(0), [[arroz, 2, 2500]]);
    await sale(daysAgo(0), [[arroz, 1, 2500]]);
    await sale(daysAgo(2), [[arroz, 4, 2500]]);
    const res = await request(app).get('/api/insights/daily-sales?days=7').set(auth(owner.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(7);
    const last = res.body.data.slice(-3);
    expect(last).toEqual([
      { date: todayInBogota(daysAgo(2)), total: 10000, count: 1 },
      { date: todayInBogota(daysAgo(1)), total: 0, count: 0 }, // gap day
      { date: todayInBogota(), total: 7500, count: 2 },
    ]);
  });
});

describe('GET /api/insights/restock', () => {
  it('applies BR4 with the default lead time and sorts by urgency, no-sales last', async () => {
    const { owner, arroz, leche, sale } = await setup();
    // Arroz: 60 units in 30 days, stock 10 → 2/day, 5 days left (≤ 3 + 3) → urgent, qty ceil(28)+5-10 = 23.
    await sale(daysAgo(5), [[arroz, 60, 2500]]);
    // Leche: 15 units → 0.5/day, stock 100 → 200 days left, not urgent.
    await sale(daysAgo(10), [[leche, 15, 4000]]);
    // Sales older than 30 days do not count.
    await sale(daysAgo(40), [[leche, 500, 4000]]);

    const res = await request(app).get('/api/insights/restock').set(auth(owner.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.map((s: { name: string }) => s.name)).toEqual(['Arroz', 'Leche', 'Quieto', 'Caviar']);
    expect(res.body.data[0]).toMatchObject({
      product: arroz.id,
      avgDaily: 2,
      daysLeft: 5,
      urgent: true,
      suggestedQty: 23,
      leadTimeDays: 3,
      bestDistributor: null,
    });
    expect(res.body.data[1]).toMatchObject({ avgDaily: 0.5, daysLeft: 200, urgent: false, suggestedQty: 0 });
    expect(res.body.data[2]).toMatchObject({ name: 'Quieto', daysLeft: null, urgent: true, suggestedQty: 3 });
  });
});
