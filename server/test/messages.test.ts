import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { Notification } from '../src/models/Notification';
import { auth, createEmployee, registerStore } from './helpers';
import { order, setup } from './order-helpers';

async function withOrder() {
  const s = await setup();
  const { body } = await order(s.store.accessToken, { distributor: s.distributorId, items: [{ catalogItem: s.rice.id, quantity: 30 }] });
  return { ...s, id: body.id as string };
}
const post = (token: string, id: string, text: unknown) => request(app).post(`/api/orders/${id}/messages`).set(auth(token)).send({ text });
const thread = (token: string, id: string, after?: string) =>
  request(app)
    .get(`/api/orders/${id}/messages`)
    .query(after ? { after } : {})
    .set(auth(token));

describe('order messages', () => {
  it('lets both sides write and read the thread in order, and notifies the other side', async () => {
    const s = await withOrder();
    const sent = await post(s.store.accessToken, s.id, '  Can you deliver before 10am?  ');
    expect(sent.status).toBe(201);
    expect(sent.body).toMatchObject({ text: 'Can you deliver before 10am?', sender: { name: 'Ana Gomez', orgType: 'store' } });

    const staff = await createEmployee(s.dist.accessToken, 'distributor_staff', 'staff@distri.co');
    await post(staff.token, s.id, 'Yes, 9am');
    const res = await thread(s.store.accessToken, s.id);
    expect(res.body.data.map((m: { text: string }) => m.text)).toEqual(['Can you deliver before 10am?', 'Yes, 9am']);

    const toStore = await Notification.find({ type: 'message', link: `/app/orders/${s.id}` });
    expect(toStore).toHaveLength(1); // store owner only (no inventory clerk in this store)
    expect(toStore[0].body).toBe('Yes, 9am');
    const unread = await request(app).get('/api/notifications?unread=true&type=message').set(auth(s.store.accessToken));
    expect(unread.body.total).toBe(1);
  });

  it('returns only newer messages with `after`', async () => {
    const s = await withOrder();
    const first = await post(s.store.accessToken, s.id, 'one');
    await new Promise((r) => setTimeout(r, 5));
    await post(s.dist.accessToken, s.id, 'two');
    const res = await thread(s.store.accessToken, s.id, first.body.createdAt);
    expect(res.body.data.map((m: { text: string }) => m.text)).toEqual(['two']);
    expect((await thread(s.store.accessToken, s.id, 'yesterday')).status).toBe(400);
  });

  it('validates length, blocks cashiers and hides the thread from third parties', async () => {
    const s = await withOrder();
    expect((await post(s.store.accessToken, s.id, 'x'.repeat(1001))).status).toBe(400);
    expect((await post(s.store.accessToken, s.id, '   ')).status).toBe(400);

    const cashier = await createEmployee(s.store.accessToken, 'store_cashier', 'caja@tienda.co');
    expect((await post(cashier.token, s.id, 'hi')).status).toBe(403);

    const stranger = await registerStore({ email: 'otra@tienda.co' });
    expect((await thread(stranger.accessToken, s.id)).status).toBe(404);
    expect((await post(stranger.accessToken, s.id, 'hi')).status).toBe(404);
  });

  it('stores markup as plain text', async () => {
    const s = await withOrder();
    const res = await post(s.store.accessToken, s.id, '<script>alert(1)</script>');
    expect(res.body.text).toBe('<script>alert(1)</script>');
  });
});
