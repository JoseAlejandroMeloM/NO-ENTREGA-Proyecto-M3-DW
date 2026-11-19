import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { PurchaseOrder, type OrderStatus } from '../src/models/PurchaseOrder';
import { dayRange, todayInBogota } from '../src/modules/sales/time';
import { auth, createEmployee, registerDistributor, registerStore } from './helpers';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Noon (Bogota) `daysAgo` days before today. */
const daysAgo = (n: number) => new Date(dayRange(todayInBogota()).start.getTime() - n * DAY + 12 * HOUR);

type Item = { name: string; quantity: number; unitPrice: number };
type Step = [OrderStatus, number]; // status and hours after the order was created

let seq = 0;
const insights = (token: string, query = '') => request(app).get(`/api/distributor-insights${query}`).set(auth(token));

async function setup() {
  const dist = await registerDistributor();
  const staff = await createEmployee(dist.accessToken, 'distributor_staff', 'staff@distri.co');
  const store = await registerStore();
  // Registration is rate-limited per file (20/hour), so the second distributor is only created by the test that needs it.
  const otherDistributor = () =>
    registerDistributor({ email: 'otro@distri.co', distributor: { name: 'Otro', nit: '900999999-1', phone: '6010000000', coverageArea: 'Chia', deliveryDays: 2, minimumOrder: 50000 } });
  const catalog = new Map<string, mongoose.Types.ObjectId>();
  /** Insert an order directly: the API always stamps "now", and these tests need old dates. */
  const order = async (
    opts: { owner?: { user: { id: string; orgId: string } }; storeName?: string; storeId?: string; created: Date; steps: Step[]; items: Item[] },
  ) => {
    const owner = opts.owner ?? dist;
    const items = opts.items.map((i) => {
      if (!catalog.has(i.name)) catalog.set(i.name, new mongoose.Types.ObjectId());
      return { catalogItem: catalog.get(i.name)!, name: i.name, unit: 'unit', category: 'groceries', quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.quantity * i.unitPrice };
    });
    const last = opts.steps[opts.steps.length - 1][0];
    return PurchaseOrder.create({
      code: `PO-T${++seq}`,
      storeId: opts.storeId ?? store.user.orgId,
      storeName: opts.storeName ?? 'Tienda Ana',
      distributorId: owner.user.orgId,
      distributorName: 'Distri Norte',
      createdBy: store.user.id,
      items,
      total: items.reduce((s, i) => s + i.subtotal, 0),
      status: last,
      statusHistory: opts.steps.map(([status, h]) => ({ status, at: new Date(opts.created.getTime() + h * HOUR), by: owner.user.id, byName: 'Luis' })),
      createdAt: opts.created,
    });
  };
  return { dist, staff, store, otherDistributor, order };
}

describe('GET /api/distributor-insights', () => {
  it('computes revenue, counts, top items and top stores from the distributor own orders only', async () => {
    const { dist, otherDistributor, order } = await setup();
    const other = await otherDistributor();
    const storeB = new mongoose.Types.ObjectId().toString();
    // Tienda Ana: two delivered orders; Tienda B: one delivered; plus one pending and one rejected.
    await order({ created: daysAgo(10), steps: [['pending', 0], ['accepted', 1], ['shipped', 2], ['delivered', 25]], items: [{ name: 'Arroz', quantity: 10, unitPrice: 5000 }, { name: 'Aceite', quantity: 2, unitPrice: 9000 }] });
    await order({ created: daysAgo(5), steps: [['pending', 0], ['accepted', 1], ['shipped', 2], ['delivered', 49]], items: [{ name: 'Arroz', quantity: 4, unitPrice: 5000 }] });
    await order({ created: daysAgo(3), storeId: storeB, storeName: 'Tienda B', steps: [['pending', 0], ['accepted', 1], ['delivered', 5]], items: [{ name: 'Azucar', quantity: 3, unitPrice: 4000 }] });
    await order({ created: daysAgo(2), steps: [['pending', 0]], items: [{ name: 'Arroz', quantity: 1, unitPrice: 5000 }] });
    await order({ created: daysAgo(2), steps: [['pending', 0], ['rejected', 1]], items: [{ name: 'Arroz', quantity: 1, unitPrice: 5000 }] });
    // Another distributor's delivered order must not leak in.
    await order({ owner: other, created: daysAgo(4), steps: [['pending', 0], ['accepted', 1], ['delivered', 3]], items: [{ name: 'Arroz', quantity: 99, unitPrice: 5000 }] });

    const res = await insights(dist.accessToken, '?range=30');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      range: 30,
      deliveredRevenue: 68000 + 20000 + 12000, // 50.000 + 18.000, 20.000, 12.000
      deliveredOrders: 3,
      ordersByStatus: { pending: 1, accepted: 0, rejected: 1, shipped: 0, delivered: 3, cancelled: 0 },
    });
    expect(res.body.topItems.map((i: { name: string; quantity: number }) => [i.name, i.quantity])).toEqual([
      ['Arroz', 14],
      ['Azucar', 3],
      ['Aceite', 2],
    ]);
    expect(res.body.topStores.map((s: { name: string; revenue: number; orders: number }) => [s.name, s.revenue, s.orders])).toEqual([
      ['Tienda Ana', 88000, 2],
      ['Tienda B', 12000, 1],
    ]);
  });

  it('averages the hours from accepted to delivered: 24 h and 48 h give 36 h', async () => {
    const { dist, order } = await setup();
    await order({ created: daysAgo(6), steps: [['pending', 0], ['accepted', 2], ['shipped', 10], ['delivered', 26]], items: [{ name: 'Arroz', quantity: 1, unitPrice: 5000 }] }); // 26 - 2 = 24 h
    await order({ created: daysAgo(4), steps: [['pending', 0], ['accepted', 1], ['delivered', 49]], items: [{ name: 'Arroz', quantity: 1, unitPrice: 5000 }] }); // 49 - 1 = 48 h
    const res = await insights(dist.accessToken);
    expect(res.status).toBe(200);
    expect(res.body.avgDeliveryHours).toBe(36);
  });

  it('acceptance rate is accepted ÷ decided: later-shipped orders count, pending and cancelled-while-pending do not', async () => {
    const { dist, order } = await setup();
    const items = [{ name: 'Arroz', quantity: 1, unitPrice: 5000 }];
    await order({ created: daysAgo(3), steps: [['pending', 0], ['accepted', 1]], items });
    await order({ created: daysAgo(3), steps: [['pending', 0], ['accepted', 1], ['shipped', 2]], items });
    await order({ created: daysAgo(3), steps: [['pending', 0], ['accepted', 1], ['shipped', 2], ['delivered', 30]], items });
    await order({ created: daysAgo(3), steps: [['pending', 0], ['rejected', 1]], items });
    await order({ created: daysAgo(3), steps: [['pending', 0]], items });
    await order({ created: daysAgo(3), steps: [['pending', 0], ['cancelled', 1]], items });
    const res = await insights(dist.accessToken);
    expect(res.body.acceptanceRate).toBe(0.75); // 3 accepted of 4 decided
    expect(res.body.ordersByStatus).toMatchObject({ accepted: 1, shipped: 1, delivered: 1, rejected: 1, pending: 1, cancelled: 1 });
  });

  it('respects the range: an order delivered 40 days ago shows only in 90 days', async () => {
    const { dist, order } = await setup();
    await order({ created: daysAgo(41), steps: [['pending', 0], ['accepted', 1], ['delivered', 20]], items: [{ name: 'Arroz', quantity: 2, unitPrice: 5000 }] });
    expect((await insights(dist.accessToken, '?range=7')).body.deliveredRevenue).toBe(0);
    expect((await insights(dist.accessToken, '?range=30')).body.deliveredRevenue).toBe(0);
    const ninety = await insights(dist.accessToken, '?range=90');
    expect(ninety.body).toMatchObject({ range: 90, deliveredRevenue: 10000, deliveredOrders: 1 });
  });

  it('returns zeros and nulls when there are no orders, and defaults to 30 days', async () => {
    const { dist } = await setup();
    const res = await insights(dist.accessToken);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      range: 30,
      deliveredRevenue: 0,
      deliveredOrders: 0,
      ordersByStatus: { pending: 0, accepted: 0, rejected: 0, shipped: 0, delivered: 0, cancelled: 0 },
      topItems: [],
      topStores: [],
      acceptanceRate: null,
      avgDeliveryHours: null,
    });
  });

  it('keeps only the top 10 items and the top 5 stores', async () => {
    const { dist, order } = await setup();
    for (let i = 1; i <= 11; i++) {
      await order({ created: daysAgo(3), storeId: new mongoose.Types.ObjectId().toString(), storeName: `Tienda ${i}`, steps: [['pending', 0], ['accepted', 1], ['delivered', 5]], items: [{ name: `Item ${i}`, quantity: i, unitPrice: 1000 }] });
    }
    const res = await insights(dist.accessToken);
    expect(res.body.topItems).toHaveLength(10);
    expect(res.body.topItems[0]).toMatchObject({ name: 'Item 11', quantity: 11 });
    expect(res.body.topStores).toHaveLength(5);
    expect(res.body.topStores[0]).toMatchObject({ name: 'Tienda 11', revenue: 11000 });
  });

  it('is for the distributor owner only: staff and store users get 403, no token 401, bad range 400', async () => {
    const { dist, staff, store } = await setup();
    expect((await insights(staff.token)).status).toBe(403);
    expect((await insights(store.accessToken)).status).toBe(403);
    expect((await request(app).get('/api/distributor-insights')).status).toBe(401);
    const bad = await insights(dist.accessToken, '?range=15');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });
});
