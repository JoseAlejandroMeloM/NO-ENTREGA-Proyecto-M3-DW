import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { Product } from '../src/models/Product';
import { Sale } from '../src/models/Sale';
import { inRestockWindow } from '../src/modules/insights/restock';
import { auth, createEmployee, registerDistributor, registerStore } from './helpers';
import { deliveredOrder } from './order-helpers';

const DAY = 24 * 60 * 60 * 1000;

/**
 * A store with Arroz carried by a distributor that delivers in 2 days, so the restock window is
 * 2 + 3 = 5 days. 40 units sold 10 days ago and 12 in stock: 40/30 per day → 9 days left.
 */
async function setup() {
  const dist = await registerDistributor(); // deliveryDays: 2
  await request(app)
    .post('/api/catalog')
    .set(auth(dist.accessToken))
    .send({ name: 'Arroz Diana 500 g', category: 'groceries', unit: 'unit', price: 2200 });
  const owner = await registerStore();
  const inventory = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
  const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
  const product = (
    await request(app)
      .post('/api/products')
      .set(auth(owner.accessToken))
      .send({ name: 'Arroz Diana 500 g', sku: 'ARR', category: 'groceries', unit: 'unit', price: 3000, stock: 12, minStock: 1 })
  ).body as { id: string; name: string; sku: string };
  await Sale.create({
    storeId: owner.user.orgId,
    cashierId: owner.user.id,
    items: [{ productId: product.id, name: product.name, sku: product.sku, quantity: 40, unitPrice: 3000, subtotal: 120000 }],
    total: 120000,
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 10 * DAY),
  });

  const sell = (quantity: number) =>
    request(app)
      .post('/api/sales')
      .set(auth(cashier.token))
      .send({ items: [{ product: product.id, quantity }], paymentMethod: 'card' });
  const adjust = (quantity: number) =>
    request(app).post(`/api/products/${product.id}/adjustments`).set(auth(owner.accessToken)).send({ quantity, reason: 'count' });
  const alerts = async (token: string) =>
    (await request(app).get('/api/notifications?type=restock_suggested').set(auth(token))).body.data as {
      title: string;
      body: string;
      link: string;
    }[];
  return { owner, inventory, cashier, product, sell, adjust, alerts };
}

describe('restock window (pure)', () => {
  it('is days left <= lead time + 3, and needs sales to predict', () => {
    // 60 units / 30 days = 2 per day; lead time 2 → window of 5 days.
    expect(inRestockWindow({ stock: 10, unitsLast30: 60, leadTimeDays: 2 })).toBe(true); // exactly 5 days
    expect(inRestockWindow({ stock: 11, unitsLast30: 60, leadTimeDays: 2 })).toBe(false); // 5.5 days
    expect(inRestockWindow({ stock: 0, unitsLast30: 0, leadTimeDays: 2 })).toBe(false); // no sales, no prediction
  });
});

describe('restock alerts after a sale', () => {
  it('notifies owner and inventory once when a sale moves a product into the window', async () => {
    const { owner, inventory, cashier, sell, alerts } = await setup();

    // 9 → about 4 days left (6 units in stock, 46 sold in 30 days) with lead time 2.
    expect((await sell(6)).status).toBe(201);
    const [alert] = await alerts(owner.accessToken);
    expect(alert).toMatchObject({ title: 'Restock soon: Arroz Diana 500 g', link: '/app/restock' });
    expect(alert.body).toContain('3.9 days');
    expect(await alerts(inventory.token)).toHaveLength(1);
    expect(await alerts(cashier.token)).toHaveLength(0);

    // Still in the window (about 3 days left): no new notification.
    expect((await sell(1)).status).toBe(201);
    expect(await alerts(owner.accessToken)).toHaveLength(1);
    expect(await alerts(inventory.token)).toHaveLength(1);
  });

  it('does not notify while the product stays outside the window', async () => {
    const { owner, sell, alerts } = await setup();
    expect((await sell(1)).status).toBe(201); // 11 in stock, 41 sold → about 8 days left
    expect(await alerts(owner.accessToken)).toHaveLength(0);
  });

  it('alerts again only after the product left the window', async () => {
    const { owner, product, sell, adjust, alerts } = await setup();
    await sell(6);
    expect(await alerts(owner.accessToken)).toHaveLength(1);

    await adjust(100); // restocked by a count; the next sale re-evaluates and leaves the window
    await sell(1);
    expect((await Product.findById(product.id))!.restockNotified).toBe(false);
    expect(await alerts(owner.accessToken)).toHaveLength(1);

    await adjust(-100);
    await sell(1); // back in the window → second alert
    expect(await alerts(owner.accessToken)).toHaveLength(2);
  });

  it('alerts for products saved before the flag existed', async () => {
    const { owner, product, sell, alerts } = await setup();
    await Product.collection.updateOne({ _id: new mongoose.Types.ObjectId(product.id) }, { $unset: { restockNotified: '' } });
    await sell(6);
    expect(await alerts(owner.accessToken)).toHaveLength(1);
  });
});

describe('restock alerts after receiving an order', () => {
  it('clears the flag when the received stock takes the product out of the window', async () => {
    const { store, product, id } = await deliveredOrder();
    await Product.updateOne({ _id: product.id }, { restockNotified: true });
    const res = await request(app).post(`/api/orders/${id}/receive`).set(auth(store.accessToken));
    expect(res.status).toBe(200);
    // No sales at all → no prediction → outside the window.
    expect((await Product.findById(product.id))!.restockNotified).toBe(false);
  });
});
