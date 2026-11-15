/**
 * `npm run demo` — runs the whole app locally with realistic demo data and no setup:
 * an in-memory MongoDB replica set (nothing is saved), the API + client in dev mode,
 * and seed data created through the real API (so every business rule applies).
 *
 * Used for design passes and demos. Demo accounts (password `demo12345`, local only):
 *   rosa@tienda.test (store owner) · inventario@tienda.test · caja@tienda.test
 *   ventas@distrinorte.test (distributor owner) · bodega@distrinorte.test (staff)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const API = 'http://localhost:4000/api';
const PASSWORD = 'demo12345';
const DAY = 24 * 60 * 60 * 1000;

type Json = Record<string, unknown>;
async function call<T = Json>(path: string, body?: unknown, token?: string, method = body ? 'POST' : 'GET'): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? {} : await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data as T;
}
const login = async (email: string) => (await call<{ accessToken: string }>('/auth/login', { email, password: PASSWORD })).accessToken;

async function waitForApi() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${API}/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('API did not start');
}

const DISTRIBUTORS = [
  {
    owner: { name: 'Carlos Ruiz', email: 'ventas@distrinorte.test' },
    company: { name: 'Distri Norte', nit: '900123456-7', phone: '6017654321', coverageArea: 'Chía, Cajicá, Cota', deliveryDays: 2, minimumOrder: 150000 },
    items: [
      ['Arroz Diana 500 g', 'groceries', 'unit', 2100],
      ['Aceite Premier 1 L', 'groceries', 'unit', 9800],
      ['Azúcar Manuelita 1 kg', 'groceries', 'unit', 3900],
      ['Gaseosa Postobón 1.5 L', 'beverages', 'unit', 3300],
      ['Agua Cristal 600 ml', 'beverages', 'unit', 1100],
      ['Leche Alquería 1 L', 'dairy', 'l', 3600],
      ['Papas Margarita 105 g', 'snacks', 'pack', 3200],
      ['Jabón Rey 300 g', 'cleaning', 'unit', 2600],
    ],
  },
  {
    owner: { name: 'Marta Gil', email: 'pedidos@sabana.test' },
    company: { name: 'Sabana Mayorista', nit: '900222333-1', phone: '6018889900', coverageArea: 'Sabana Centro', deliveryDays: 1, minimumOrder: 300000 },
    items: [
      ['Arroz Diana 500 g x 25', 'groceries', 'pack', 49000],
      ['Arroz Roa 1 kg', 'groceries', 'unit', 4300],
      ['Café Sello Rojo 250 g', 'groceries', 'unit', 8900],
      ['Gaseosa Postobón 1.5 L', 'beverages', 'unit', 3150],
      ['Cerveza Águila 330 ml', 'beverages', 'unit', 2500],
      ['Queso campesino 500 g', 'dairy', 'unit', 9500],
      ['Detergente Fab 1 kg', 'cleaning', 'unit', 11200],
    ],
  },
  {
    owner: { name: 'Pedro Suárez', email: 'campo@fresco.test' },
    company: { name: 'Campo Fresco', nit: '900444555-2', phone: '3104445566', coverageArea: 'Chía, Zipaquirá', deliveryDays: 3, minimumOrder: 80000 },
    items: [
      ['Papa pastusa', 'fruits_vegetables', 'kg', 1800],
      ['Tomate chonto', 'fruits_vegetables', 'kg', 3200],
      ['Cebolla cabezona', 'fruits_vegetables', 'kg', 2600],
      ['Banano', 'fruits_vegetables', 'kg', 2100],
      ['Huevos AA x 30', 'other', 'pack', 16500],
      ['Pan tajado Bimbo', 'bakery', 'unit', 6200],
    ],
  },
] as const;

// name, sku, category, unit, price, cost, stock, minStock, sold per day (for history)
const PRODUCTS = [
  ['Arroz Diana 500 g', 'ARR-500', 'groceries', 'unit', 2800, 2100, 6, 15, 4],
  ['Aceite Premier 1 L', 'ACE-1L', 'groceries', 'unit', 12500, 9800, 14, 6, 1],
  ['Azúcar Manuelita 1 kg', 'AZU-1K', 'groceries', 'unit', 4900, 3900, 22, 8, 2],
  ['Café Sello Rojo 250 g', 'CAF-250', 'groceries', 'unit', 11000, 8900, 3, 5, 1],
  ['Gaseosa Postobón 1.5 L', 'GAS-15', 'beverages', 'unit', 4500, 3300, 30, 12, 5],
  ['Agua Cristal 600 ml', 'AGU-600', 'beverages', 'unit', 1800, 1100, 48, 20, 6],
  ['Cerveza Águila 330 ml', 'CER-330', 'beverages', 'unit', 3500, 2500, 60, 24, 8],
  ['Leche Alquería 1 L', 'LEC-1L', 'dairy', 'l', 4800, 3600, 9, 10, 4],
  ['Queso campesino 500 g', 'QUE-500', 'dairy', 'unit', 12500, 9500, 5, 3, 1],
  ['Papas Margarita 105 g', 'PAP-105', 'snacks', 'pack', 4200, 3200, 25, 10, 3],
  ['Jabón Rey 300 g', 'JAB-300', 'cleaning', 'unit', 3500, 2600, 18, 6, 1],
  ['Papa pastusa', 'PAPA-KG', 'fruits_vegetables', 'kg', 2600, 1800, 2, 10, 3],
  ['Huevos AA x 30', 'HUE-30', 'other', 'pack', 21000, 16500, 7, 4, 1],
  ['Pan tajado Bimbo', 'PAN-TAJ', 'bakery', 'unit', 8000, 6200, 4, 5, 2],
] as const;

async function seed(uri: string) {
  // Store with its team
  const store = await call<{ accessToken: string; user: { orgId: string } }>('/auth/register-store', {
    name: 'Rosa Pérez',
    email: 'rosa@tienda.test',
    password: PASSWORD,
    store: { name: 'Tienda Doña Rosa', address: 'Calle 12 # 8-30, Chía', phone: '3001234567' },
  });
  const S = store.accessToken;
  await call('/users', { name: 'Julián Mora', email: 'inventario@tienda.test', password: PASSWORD, role: 'store_inventory' }, S);
  const cashier = await call<{ id: string }>('/users', { name: 'Camila Ríos', email: 'caja@tienda.test', password: PASSWORD, role: 'store_cashier' }, S);

  // Distributors with catalogs
  const dists: { id: string; token: string; items: Map<string, string> }[] = [];
  for (const d of DISTRIBUTORS) {
    const res = await call<{ accessToken: string; user: { orgId: string } }>('/auth/register-distributor', {
      ...d.owner,
      password: PASSWORD,
      distributor: d.company,
    });
    const items = new Map<string, string>();
    for (const [name, category, unit, price] of d.items) {
      const item = await call<{ id: string }>('/catalog', { name, category, unit, price }, res.accessToken);
      items.set(name, item.id);
    }
    dists.push({ id: res.user.orgId, token: res.accessToken, items });
  }
  await call('/users', { name: 'Andrés Bodega', email: 'bodega@distrinorte.test', password: PASSWORD, role: 'distributor_staff' }, dists[0].token);

  // Products
  const products: { id: string; name: string; sku: string; price: number; perDay: number }[] = [];
  for (const [name, sku, category, unit, price, cost, stock, minStock, perDay] of PRODUCTS) {
    const p = await call<{ id: string }>('/products', { name, sku, category, unit, price, cost, stock, minStock }, S);
    products.push({ id: p.id, name, sku, price, perDay });
  }

  // 60 days of sales history, inserted directly (the API always stamps "now").
  await mongoose.connect(uri);
  const methods = ['cash', 'cash', 'nequi', 'card'] as const;
  const sales = [];
  for (let day = 60; day >= 1; day--) {
    const weekend = new Date(Date.now() - day * DAY).getDay() % 6 === 0;
    for (let n = 0; n < (weekend ? 9 : 6); n++) {
      const lines = products
        .filter((p) => Math.random() < p.perDay / 8)
        .slice(0, 4)
        .map((p) => {
          const quantity = 1 + Math.floor(Math.random() * 2);
          return { productId: new mongoose.Types.ObjectId(p.id), name: p.name, sku: p.sku, quantity, unitPrice: p.price, subtotal: quantity * p.price };
        });
      if (lines.length === 0) continue;
      const total = lines.reduce((s, l) => s + l.subtotal, 0);
      const paymentMethod = methods[Math.floor(Math.random() * methods.length)];
      const when = new Date(Date.now() - day * DAY + (8 + n * 1.5) * 3600_000);
      sales.push({
        storeId: new mongoose.Types.ObjectId(store.user.orgId),
        cashierId: new mongoose.Types.ObjectId(cashier.id),
        items: lines,
        total,
        paymentMethod,
        ...(paymentMethod === 'cash' ? { amountReceived: Math.ceil(total / 10000) * 10000, change: Math.ceil(total / 10000) * 10000 - total } : {}),
        createdAt: when,
        updatedAt: when,
      });
    }
  }
  await mongoose.connection.collection('sales').insertMany(sales);
  await mongoose.disconnect();

  // A few sales today through the API (real stock decrements).
  const C = await login('caja@tienda.test');
  const byName = new Map(products.map((p) => [p.name, p]));
  const sell = (items: [string, number][], paymentMethod: string, amountReceived?: number) =>
    call('/sales', { items: items.map(([n, quantity]) => ({ product: byName.get(n)!.id, quantity })), paymentMethod, amountReceived }, C);
  await sell([['Gaseosa Postobón 1.5 L', 2], ['Papas Margarita 105 g', 1]], 'cash', 20000);
  await sell([['Cerveza Águila 330 ml', 6]], 'nequi');
  await sell([['Leche Alquería 1 L', 1], ['Arroz Diana 500 g', 2]], 'card');

  // Purchase orders in every stage, with messages and a rating.
  const [norte, sabana, campo] = dists;
  const order = (d: (typeof dists)[number], items: [string, number][], note?: string) =>
    call<{ id: string }>('/orders', { distributor: d.id, items: items.map(([n, quantity]) => ({ catalogItem: d.items.get(n)!, quantity })), note }, S);
  const status = (d: (typeof dists)[number], id: string, s: string, note?: string) => call(`/orders/${id}/status`, { status: s, note }, d.token, 'PATCH');

  const delivered = await order(norte, [['Arroz Diana 500 g', 40], ['Leche Alquería 1 L', 24]]);
  for (const s of ['accepted', 'shipped', 'delivered']) await status(norte, delivered.id, s);
  await call(`/orders/${delivered.id}/receive`, {}, S);
  await call(`/orders/${delivered.id}/rating`, { stars: 5, comment: 'Llegó completo y a tiempo.' }, S);

  const shipped = await order(campo, [['Papa pastusa', 30], ['Huevos AA x 30', 4]]);
  await status(campo, shipped.id, 'accepted');
  await status(campo, shipped.id, 'shipped', 'Sale en el camión de la mañana');
  await call(`/orders/${shipped.id}/messages`, { text: '¿A qué hora llega? Abrimos a las 7.' }, S);
  await call(`/orders/${shipped.id}/messages`, { text: 'Entre 8 y 9 am. El conductor es Jairo.' }, campo.token);

  const accepted = await order(sabana, [['Cerveza Águila 330 ml', 96], ['Café Sello Rojo 250 g', 12]]);
  await status(sabana, accepted.id, 'accepted');

  const pending = await order(norte, [['Gaseosa Postobón 1.5 L', 48], ['Papas Margarita 105 g', 20]], 'Por favor incluir factura.');
  await call(`/orders/${pending.id}/messages`, { text: '¿Tienen promoción en gaseosa esta semana?' }, S);

  const rejected = await order(sabana, [['Detergente Fab 1 kg', 30]]);
  await status(sabana, rejected.id, 'rejected', 'Sin inventario de Fab hasta el lunes');
}

async function main() {
  const db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = db.getUri('conecta-demo');
  const dev = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI: uri, JWT_SECRET: 'local-demo-secret-local-demo-secret-0123', NODE_ENV: 'development' },
  });
  const stop = async () => {
    dev.kill('SIGINT');
    await db.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  await waitForApi();
  await seed(uri);
  console.log(`
  Demo ready → http://localhost:5173  (data lives in memory; Ctrl+C stops everything)
  Password for every account: ${PASSWORD}
    Store:       rosa@tienda.test (owner) · inventario@tienda.test · caja@tienda.test
    Distributor: ventas@distrinorte.test (owner) · bodega@distrinorte.test (staff)
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
