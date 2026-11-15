import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { auth, createEmployee } from './helpers';
import { deliveredOrder, order, setStatus, setup } from './order-helpers';

describe('receiving and rating', () => {
  it('adds stock once, creating products it does not find', async () => {
    const { store, id, product } = await deliveredOrder();
    const res = await request(app).post(`/api/orders/${id}/receive`).set(auth(store.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.receivedAt).toBeTruthy();

    const rice = await request(app).get(`/api/products/${product.id}`).set(auth(store.accessToken));
    expect(rice.body.stock).toBe(3 + 12);
    const moves = await request(app).get(`/api/products/${product.id}/movements`).set(auth(store.accessToken));
    expect(moves.body.data[0]).toMatchObject({ type: 'order_received', quantity: 12 });

    const created = await request(app).get('/api/products?q=Gaseosa').set(auth(store.accessToken));
    expect(created.body.data[0]).toMatchObject({ stock: 20, cost: 3000, price: 3900 });

    const again = await request(app).post(`/api/orders/${id}/receive`).set(auth(store.accessToken));
    expect(again.status).toBe(409);
    expect((await request(app).get(`/api/products/${product.id}`).set(auth(store.accessToken))).body.stock).toBe(15);
  });

  it('refuses to receive or rate before delivery', async () => {
    const s = await setup();
    const { body } = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
    await setStatus(s.dist.accessToken, body.id, 'accepted');
    await setStatus(s.dist.accessToken, body.id, 'shipped');
    expect((await request(app).post(`/api/orders/${body.id}/receive`).set(auth(s.store.accessToken))).status).toBe(409);
    expect((await request(app).post(`/api/orders/${body.id}/rating`).set(auth(s.store.accessToken)).send({ stars: 4 })).status).toBe(409);
  });

  it('rates once (owner only) and keeps the distributor average', async () => {
    const s = await deliveredOrder();
    const clerk = await createEmployee(s.store.accessToken, 'store_inventory', 'inv@tienda.co');
    expect((await request(app).post(`/api/orders/${s.id}/rating`).set(auth(clerk.token)).send({ stars: 4 })).status).toBe(403);

    const rate = (id: string, stars: number) => request(app).post(`/api/orders/${id}/rating`).set(auth(s.store.accessToken)).send({ stars });
    expect((await rate(s.id, 5)).status).toBe(201);
    expect((await rate(s.id, 1)).status).toBe(409);

    // Two more delivered orders rated 3 and 4 → (5 + 3 + 4) / 3 = 4.0
    for (const stars of [3, 4]) {
      const { body } = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
      for (const st of ['accepted', 'shipped', 'delivered']) await setStatus(s.dist.accessToken, body.id, st);
      await rate(body.id, stars);
    }
    const profile = await request(app).get(`/api/distributors/${s.distributorId}`).set(auth(s.store.accessToken));
    expect(profile.body).toMatchObject({ ratingAverage: 4, ratingCount: 3 });
  });
});
