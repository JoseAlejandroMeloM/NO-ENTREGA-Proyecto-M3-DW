import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { Notification } from '../src/models/Notification';
import { auth, createEmployee, registerDistributor, registerStore } from './helpers';
import { deliveredOrder, order, setStatus, setup } from './order-helpers';

describe('creating purchase orders', () => {
  it('creates a pending order priced from the catalog and notifies the distributor', async () => {
    const s = await setup();
    const clerk = await createEmployee(s.store.accessToken, 'store_inventory', 'inv@tienda.co');
    const res = await order(clerk.token, {
      distributor: s.distributorId,
      items: [
        { catalogItem: s.rice.id, quantity: 10 },
        { catalogItem: s.soda.id, quantity: 20 },
        { catalogItem: s.rice.id, quantity: 2 }, // merged with the first line
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'pending', total: 12 * 5000 + 20 * 3000, store: { name: 'Tienda Ana' } });
    expect(res.body.code).toMatch(/^PO-\d{6}$/);
    expect(res.body.items).toHaveLength(2);
    const note = await Notification.findOne({ type: 'order_created' });
    expect(note?.link).toBe(`/dist/orders/${res.body.id}`);
  });

  it('rejects totals below the minimum order, unavailable or foreign items, and cashiers', async () => {
    const s = await setup();
    const low = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 1 }] });
    expect(low.status).toBe(400);
    expect(low.body.error.code).toBe('BELOW_MINIMUM_ORDER');

    const unavailable = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.off.id, quantity: 50 }] });
    expect(unavailable.status).toBe(400);
    expect(unavailable.body.error.details[0].path).toBe('items.0.catalogItem');

    const other = await registerDistributor({ email: 'otro@distri.co', distributor: { name: 'Otro', nit: '800111222-3', phone: '6011111111', coverageArea: 'Chia', deliveryDays: 1, minimumOrder: 0 } });
    const foreign = await order(s.store.accessToken, { distributor: other.user.orgId, items: [{ catalogItem: s.rice.id, quantity: 50 }] });
    expect(foreign.status).toBe(400);

    const cashier = await createEmployee(s.store.accessToken, 'store_cashier', 'caja@tienda.co');
    expect((await order(cashier.token, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 50 }] })).status).toBe(403);
  });

  it('scopes orders to the two organizations', async () => {
    const s = await setup();
    const created = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
    const staff = await createEmployee(s.dist.accessToken, 'distributor_staff', 'staff@distri.co');
    const pending = await request(app).get('/api/orders?status=pending').set(auth(staff.token));
    expect(pending.body.total).toBe(1);
    expect((await request(app).get('/api/orders?status=shipped').set(auth(staff.token))).body.total).toBe(0);

    const stranger = await registerStore({ email: 'otra@tienda.co' });
    expect((await request(app).get(`/api/orders/${created.body.id}`).set(auth(stranger.accessToken))).status).toBe(404);
  });
});

describe('order status workflow', () => {
  it('runs the happy path with a timeline and notifies the store on each change', async () => {
    const { store, id } = await deliveredOrder();
    const res = await request(app).get(`/api/orders/${id}`).set(auth(store.accessToken));
    expect(res.body.status).toBe('delivered');
    expect(res.body.statusHistory.map((h: { status: string }) => h.status)).toEqual(['pending', 'accepted', 'shipped', 'delivered']);
    expect(res.body.statusHistory[1].by.name).toBe('Luis Perez');
    expect(await Notification.countDocuments({ type: 'order_status', link: `/app/orders/${id}` })).toBeGreaterThanOrEqual(3);
  });

  it('enforces transitions and roles', async () => {
    const s = await setup();
    const { body } = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });

    const jump = await setStatus(s.dist.accessToken, body.id, 'delivered');
    expect(jump.status).toBe(409);
    expect(jump.body.error.code).toBe('INVALID_TRANSITION');

    const staff = await createEmployee(s.dist.accessToken, 'distributor_staff', 'staff@distri.co');
    expect((await setStatus(staff.token, body.id, 'accepted')).status).toBe(403);
    expect((await setStatus(s.store.accessToken, body.id, 'accepted')).status).toBe(403);

    const noReason = await setStatus(s.dist.accessToken, body.id, 'rejected');
    expect(noReason.status).toBe(400);
    expect(noReason.body.error.details[0].path).toBe('note');

    await setStatus(s.dist.accessToken, body.id, 'accepted');
    await setStatus(staff.token, body.id, 'shipped');
    expect((await setStatus(s.store.accessToken, body.id, 'cancelled')).status).toBe(409);
  });

  it('lets the store cancel a pending order and the distributor reject with a reason', async () => {
    const s = await setup();
    const a = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
    expect((await setStatus(s.store.accessToken, a.body.id, 'cancelled')).body.status).toBe('cancelled');
    const b = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
    const rejected = await setStatus(s.dist.accessToken, b.body.id, 'rejected', 'No stock this week');
    expect(rejected.body).toMatchObject({ status: 'rejected', rejectReason: 'No stock this week' });
  });

  it('lets only one of two concurrent transitions win', async () => {
    const s = await setup();
    const { body } = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
    const [x, y] = await Promise.all([
      setStatus(s.dist.accessToken, body.id, 'accepted'),
      setStatus(s.store.accessToken, body.id, 'cancelled'),
    ]);
    expect([x.status, y.status].sort()).toEqual([200, 409]);
  });
});

