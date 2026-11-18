import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { PurchaseOrder } from '../src/models/PurchaseOrder';
import { dayRange, todayInBogota } from '../src/modules/sales/time';
import { auth, createEmployee } from './helpers';
import { order, setStatus, setup } from './order-helpers';

/** A pending order worth at least the minimum, ready to be accepted. */
async function pendingOrder() {
  const s = await setup();
  const created = await order(s.store.accessToken, {
    distributor: s.distributorId,
    items: [{ catalogItem: s.rice.id, quantity: 12 }, { catalogItem: s.soda.id, quantity: 20 }],
  });
  return { ...s, id: created.body.id as string };
}

describe('estimated delivery on accept', () => {
  it('defaults to today plus the distributor delivery days', async () => {
    const { dist, store, id } = await pendingOrder();
    // Act: accept without a date; the distributor has 2 delivery days.
    const accepted = await setStatus(dist.accessToken, id, 'accepted');
    // Assert: estimated for the start of the Bogota day two days from today.
    const expected = new Date(dayRange(todayInBogota()).start.getTime() + 2 * 24 * 60 * 60 * 1000);
    expect(new Date(accepted.body.estimatedDelivery).toISOString()).toBe(expected.toISOString());
    expect(accepted.body.delayed).toBe(false);
    // The store sees the same estimate.
    const seen = await request(app).get(`/api/orders/${id}`).set(auth(store.accessToken));
    expect(new Date(seen.body.estimatedDelivery).toISOString()).toBe(expected.toISOString());
  });

  it('honours a provided future date and rejects a past one', async () => {
    const s = await pendingOrder();
    const future = '2030-01-15';
    const ok = await request(app)
      .patch(`/api/orders/${s.id}/status`)
      .set(auth(s.dist.accessToken))
      .send({ status: 'accepted', estimatedDelivery: future });
    expect(ok.status).toBe(200);
    expect(new Date(ok.body.estimatedDelivery).toISOString()).toBe(dayRange(future).start.toISOString());

    // A second order in the same organizations (no new registrations).
    const second = await order(s.store.accessToken, {
      distributor: s.distributorId,
      items: [{ catalogItem: s.rice.id, quantity: 30 }],
    });
    const past = await request(app)
      .patch(`/api/orders/${second.body.id}/status`)
      .set(auth(s.dist.accessToken))
      .send({ status: 'accepted', estimatedDelivery: '2020-01-01' });
    expect(past.status).toBe(400);
    expect(past.body.error.details[0].path).toBe('estimatedDelivery');
  });
});

describe('tracking notes', () => {
  it('lets distributor users add notes to shipped orders and shows them to the store', async () => {
    const { dist, store, id } = await pendingOrder();
    const staff = await createEmployee(dist.accessToken, 'distributor_staff', 'staff@distri.co');
    await setStatus(dist.accessToken, id, 'accepted');
    await setStatus(dist.accessToken, id, 'shipped');

    const added = await request(app)
      .post(`/api/orders/${id}/tracking`)
      .set(auth(staff.token))
      .send({ text: 'Left the warehouse' });
    expect(added.status).toBe(201);
    expect(added.body.trackingNotes).toHaveLength(1);
    expect(added.body.trackingNotes[0]).toMatchObject({ text: 'Left the warehouse', by: { name: 'Employee Test' } });

    // The store sees the note on the timeline.
    const seen = await request(app).get(`/api/orders/${id}`).set(auth(store.accessToken));
    expect(seen.body.trackingNotes[0].text).toBe('Left the warehouse');
  });

  it('forbids store users and refuses notes on delivered orders', async () => {
    const { dist, store, id } = await pendingOrder();
    await setStatus(dist.accessToken, id, 'accepted');
    await setStatus(dist.accessToken, id, 'shipped');

    // Store owner cannot add tracking notes.
    const forbidden = await request(app).post(`/api/orders/${id}/tracking`).set(auth(store.accessToken)).send({ text: 'Hi' });
    expect(forbidden.status).toBe(403);

    // Once delivered, the window is closed.
    await setStatus(dist.accessToken, id, 'delivered');
    const late = await request(app).post(`/api/orders/${id}/tracking`).set(auth(dist.accessToken)).send({ text: 'Too late' });
    expect(late.status).toBe(409);
  });
});

describe('delayed flag in lists', () => {
  it('flags an overdue accepted/shipped order on both sides', async () => {
    const { dist, store, id } = await pendingOrder();
    await setStatus(dist.accessToken, id, 'accepted');
    await setStatus(dist.accessToken, id, 'shipped');

    // Push the estimate into the past (its Bogota day already ended).
    await PurchaseOrder.updateOne({ _id: id }, { $set: { estimatedDelivery: dayRange('2020-01-01').start } });

    const storeList = await request(app).get('/api/orders').set(auth(store.accessToken));
    expect(storeList.body.data.find((o: { id: string }) => o.id === id).delayed).toBe(true);
    const distList = await request(app).get('/api/orders').set(auth(dist.accessToken));
    expect(distList.body.data.find((o: { id: string }) => o.id === id).delayed).toBe(true);
  });
});
