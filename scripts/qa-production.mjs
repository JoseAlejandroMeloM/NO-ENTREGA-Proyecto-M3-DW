// Production QA runner (API level): QA-01–07, 10–23, 25 + extra security checks. Creates fresh qa-* test accounts.
// Usage: node scripts/qa-production.mjs https://conecta-negocio.vercel.app   (writes qa-results.json, git-ignored)
// Note: the QA-03 check runs last and locks failed logins from your IP for 15 minutes.
/* global fetch, console, process, setTimeout */
import fs from 'node:fs';
const BASE = process.argv[2];
const API = `${BASE}/api`;
const RUN = Date.now().toString(36);
const PW = 'QaRun-' + RUN + '-pass';
const results = [];
const log = [];

async function call(method, path, body, token, raw = false) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  let data = null;
  try { data = res.status === 204 ? null : await res.json(); } catch { /* not json */ }
  log.push(`${method} ${path} → ${res.status}${data?.error ? ' ' + data.error.code : ''}`);
  return raw ? { res, data } : { status: res.status, data };
}
const arr = (d) => (Array.isArray(d) ? d : d?.items ?? d?.data ?? d?.results ?? Object.values(d ?? {}).find(Array.isArray) ?? []);
function record(id, title, checks) {
  const pass = checks.every((c) => c.ok);
  results.push({ id, title, pass, checks });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${title}`);
  for (const c of checks) if (!c.ok) console.log('   ✗', c.what, '→', c.got);
}
const chk = (what, ok, got) => ({ what, ok: !!ok, got });
const email = (who) => `qa-${who}-${RUN}@conecta.test`;
const nit = () => `9${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}-${Math.floor(Math.random() * 10)}`;

// QA-01 register store
const s1 = await call('POST', '/auth/register-store', { name: 'QA Owner', email: email('owner'), password: PW, store: { name: `QA Tienda ${RUN}`, address: 'Calle 1 # 2-3, Chía', phone: '3001112233' } });
const S = s1.data?.accessToken;
const me = await call('GET', '/auth/me', undefined, S);
record('QA-01', 'Register a new store', [chk('201 Created', s1.status === 201, s1.status), chk('role store_owner', JSON.stringify(me.data).includes('store_owner'), me.status)]);

// QA-02 register distributor (x2 for compare)
const mkDist = (who, name, minimumOrder, deliveryDays) => call('POST', '/auth/register-distributor', { name: `QA ${who}`, email: email(who), password: PW, distributor: { name: `${name} ${RUN}`, nit: nit(), phone: '6011234567', coverageArea: 'Chía', deliveryDays, minimumOrder } });
const d1 = await mkDist('dist1', 'QA Distri Uno', 150000, 2);
const d2 = await mkDist('dist2', 'QA Distri Dos', 80000, 1);
const D1 = d1.data?.accessToken, D2 = d2.data?.accessToken;
const d1me = await call('GET', '/auth/me', undefined, D1);
record('QA-02', 'Register a new distributor', [chk('201 Created', d1.status === 201, d1.status), chk('role distributor_owner', JSON.stringify(d1me.data).includes('distributor_owner'), d1me.status)]);

// QA-03 login ok / wrong password (429 part runs at the end)
const ok = await call('POST', '/auth/login', { email: email('owner'), password: PW });
const bad = await call('POST', '/auth/login', { email: email('owner'), password: 'wrong-password-1' });
const qa03 = [chk('valid login → 200 + token', ok.status === 200 && ok.data?.accessToken, ok.status), chk('wrong password → 401', bad.status === 401, bad.status)];

// QA-04 owner creates cashier; cashier calls employees endpoint
const cash = await call('POST', '/users', { name: 'QA Cajero', email: email('cashier'), password: PW, role: 'store_cashier' }, S);
await call('POST', '/users', { name: 'QA Inventario', email: email('inventory'), password: PW, role: 'store_inventory' }, S);
const C = (await call('POST', '/auth/login', { email: email('cashier'), password: PW })).data?.accessToken;
const I = (await call('POST', '/auth/login', { email: email('inventory'), password: PW })).data?.accessToken;
const cashUsers = await call('POST', '/users', { name: 'X', email: email('x'), password: PW, role: 'store_cashier' }, C);
record('QA-04', 'Owner creates cashier; cashier calls employee endpoint', [chk('owner creates cashier → 201', cash.status === 201, cash.status), chk('cashier creates employee → 403', cashUsers.status === 403, cashUsers.status)]);

// QA-05 product CRUD as inventory; cashier tries
const p = await call('POST', '/products', { name: 'QA Producto', sku: `QA-${RUN}`, category: 'groceries', unit: 'unit', price: 5000, cost: 3500, stock: 10, minStock: 2 }, I);
const pid = p.data?.id;
const pe = await call('PATCH', `/products/${pid}`, { price: 5500 }, I);
const pc = await call('POST', '/products', { name: 'QA Cajero Prod', sku: `QAC-${RUN}`, category: 'groceries', unit: 'unit', price: 1000, cost: 500, stock: 1, minStock: 0 }, C);
const pdel = await call('DELETE', `/products/${pid}`, undefined, I);
record('QA-05', 'Create, edit, delete product as inventory; try as cashier', [chk('create → 201', p.status === 201, p.status), chk('edit → 200', pe.status === 200, pe.status), chk('delete → 204/200', [200, 204].includes(pdel.status), pdel.status), chk('cashier create → 403', pc.status === 403, pc.status)]);

// Products for sales / orders
const mk = (name, sku, price, stock, minStock) => call('POST', '/products', { name, sku: `${sku}-${RUN}`, category: 'groceries', unit: 'unit', price, cost: Math.round(price * 0.7), stock, minStock }, S);
const arroz = (await mk('Arroz QA 500 g', 'QARR', 2800, 6, 3)).data;
const gaseosa = (await mk('Gaseosa QA 1.5 L', 'QGAS', 4500, 30, 5)).data;

// QA-06 adjust -999
const adj = await call('POST', `/products/${gaseosa.id}/adjustments`, { quantity: -999, reason: 'count' }, S);
const g1 = await call('GET', `/products/${gaseosa.id}`, undefined, S);
record('QA-06', 'Adjust stock -999', [chk('→ 400/409', [400, 409].includes(adj.status), `${adj.status} ${adj.data?.error?.code}`), chk('stock unchanged (30)', g1.data?.stock === 30, g1.data?.stock)]);

// QA-10 cash sale with change; sale exceeding stock
const sale1 = await call('POST', '/sales', { items: [{ product: gaseosa.id, quantity: 2 }], paymentMethod: 'cash', amountReceived: 10000 }, C);
const over = await call('POST', '/sales', { items: [{ product: gaseosa.id, quantity: 999 }], paymentMethod: 'cash', amountReceived: 1e7 }, C);
record('QA-10', 'Sale paid in cash with change; sale exceeding stock', [chk('cash sale → 201', sale1.status === 201, sale1.status), chk('change = 1000', sale1.data?.change === 1000, sale1.data?.change), chk('over stock → 409', over.status === 409, `${over.status} ${over.data?.error?.code}`)]);

// QA-07 sell until stock <= min → notification
const sale2 = await call('POST', '/sales', { items: [{ product: arroz.id, quantity: 4 }], paymentMethod: 'card' }, C);
await new Promise((r) => setTimeout(r, 1500));
const notif = await call('GET', '/notifications?unread=true', undefined, S);
const low = arr(notif.data).find((n) => JSON.stringify(n).includes('Arroz QA'));
record('QA-07', 'Sell until stock ≤ min', [chk('sale → 201', sale2.status === 201, sale2.status), chk('low-stock notification for owner', low, arr(notif.data).length)]);

// QA-11 filter by Nequi; cashier sees only own sales
await call('POST', '/sales', { items: [{ product: gaseosa.id, quantity: 1 }], paymentMethod: 'nequi' }, S);
const nequi = await call('GET', '/sales?paymentMethod=nequi', undefined, S);
const nequiList = arr(nequi.data);
const cashierList = arr((await call('GET', '/sales', undefined, C)).data);
record('QA-11', 'Filter by Nequi; cashier views history', [chk('only Nequi', nequiList.length > 0 && nequiList.every((s) => s.paymentMethod === 'nequi'), nequiList.map((s) => s.paymentMethod).join(',')), chk('cashier sees only own (2, not the owner nequi sale)', cashierList.length === 2, cashierList.length)]);

// QA-12 today's totals vs sum
const summary = await call('GET', '/sales/summary/daily', undefined, S);
const all = arr((await call('GET', '/sales', undefined, S)).data);
const sum = all.reduce((t, s) => t + s.total, 0);
record('QA-12', "Today's totals vs sum of sales", [chk('summary total = sum of sales', JSON.stringify(summary.data).includes(String(sum)), `sum ${sum}; summary ${JSON.stringify(summary.data).slice(0, 160)}`)]);

// QA-13 distributor creates item; store user tries
const items1 = {};
for (const [name, price] of [['Arroz Diana 500 g', 2100], ['Gaseosa Postobón 1.5 L', 3300]]) items1[name] = (await call('POST', '/catalog', { name, category: name.startsWith('Arroz') ? 'groceries' : 'beverages', unit: 'unit', price }, D1)).data?.id;
const c2 = await call('POST', '/catalog', { name: 'Arroz Roa 500 g', category: 'groceries', unit: 'unit', price: 1900 }, D2);
const cs = await call('POST', '/catalog', { name: 'Hack', category: 'groceries', unit: 'unit', price: 1 }, S);
record('QA-13', 'Distributor creates item; store user tries', [chk('distributor → 201', c2.status === 201 && items1['Arroz Diana 500 g'], c2.status), chk('store → 403', cs.status === 403, cs.status)]);

// QA-14 compare arroz sorted by price
const cmp = await call('GET', '/distributors/compare?q=arroz&sort=price', undefined, S);
const prices = arr(cmp.data).map((r) => r.price ?? r.item?.price ?? r.catalogItem?.price);
record('QA-14', 'Compare "arroz" across distributors, sort by price', [chk('200 with ≥2 results', cmp.status === 200 && prices.length >= 2, `${cmp.status} ${prices}`), chk('ascending price', prices.every((v, i) => i === 0 || prices[i - 1] <= v), prices.join(' ≤ '))]);

// QA-15 order below minimum; valid order
const d1id = d1.data?.user?.orgId;
const order = (items, note) => call('POST', '/orders', { distributor: d1id, items, note }, S);
const small = await order([{ catalogItem: items1['Arroz Diana 500 g'], quantity: 2 }]);
const o1 = await order([{ catalogItem: items1['Arroz Diana 500 g'], quantity: 50 }, { catalogItem: items1['Gaseosa Postobón 1.5 L'], quantity: 24 }], 'QA order');
await new Promise((r) => setTimeout(r, 1000));
const dn = await call('GET', '/notifications', undefined, D1);
record('QA-15', 'Order below minimum; valid order', [chk('below minimum → 400', small.status === 400, `${small.status} ${small.data?.error?.code}`), chk('valid → 201 pending', o1.status === 201 && o1.data?.status === 'pending', `${o1.status} ${o1.data?.status}`), chk('distributor notified', arr(dn.data).some((n) => JSON.stringify(n).includes(o1.data?.code)), arr(dn.data).length)]);

// QA-16 accept → ship → deliver; deliver a pending order
const st = (id, status, tok) => call('PATCH', `/orders/${id}/status`, { status }, tok);
const o2 = (await order([{ catalogItem: items1['Gaseosa Postobón 1.5 L'], quantity: 50 }])).data;
const pendDeliver = await st(o2.id, 'delivered', D1);
const a = await st(o1.data.id, 'accepted', D1), sh = await st(o1.data.id, 'shipped', D1), de = await st(o1.data.id, 'delivered', D1);
const hist = (await call('GET', `/orders/${o1.data.id}`, undefined, S)).data?.statusHistory ?? [];
record('QA-16', 'Accept → ship → deliver; deliver a pending order', [chk('accept/ship/deliver → 200', [a, sh, de].every((r) => r.status === 200), [a, sh, de].map((r) => r.status).join(',')), chk('timeline has 4 entries', hist.length === 4, hist.map((h) => h.status).join('→')), chk('deliver pending → 409', pendDeliver.status === 409, pendDeliver.status)]);

// QA-17 store cancels pending; cancels shipped
const cancelPending = await st(o2.id, 'cancelled', S);
const o3 = (await order([{ catalogItem: items1['Gaseosa Postobón 1.5 L'], quantity: 50 }])).data;
await st(o3.id, 'accepted', D1); await st(o3.id, 'shipped', D1);
const cancelShipped = await st(o3.id, 'cancelled', S);
record('QA-17', 'Store cancels pending order; cancels shipped order', [chk('cancel pending → 200', cancelPending.status === 200, cancelPending.status), chk('cancel shipped → 409', cancelShipped.status === 409, cancelShipped.status)]);

// QA-18 receive twice
const before = (await call('GET', `/products/${arroz.id}`, undefined, S)).data?.stock;
const r1 = await call('POST', `/orders/${o1.data.id}/receive`, {}, S);
const r2 = await call('POST', `/orders/${o1.data.id}/receive`, {}, S);
const after = (await call('GET', `/products/${arroz.id}`, undefined, S)).data?.stock;
record('QA-18', 'Receive delivered order twice', [chk('first → 200', r1.status === 200, r1.status), chk('second → 409', r2.status === 409, r2.status), chk('stock +50 once', after === before + 50, `${before} → ${after}`)]);

// QA-19 rate twice
const rt1 = await call('POST', `/orders/${o1.data.id}/rating`, { stars: 4, comment: 'QA: completo' }, S);
const rt2 = await call('POST', `/orders/${o1.data.id}/rating`, { stars: 1 }, S);
record('QA-19', 'Rate delivered order twice', [chk('first → 201/200', [200, 201].includes(rt1.status), rt1.status), chk('second → 409', rt2.status === 409, rt2.status)]);

// QA-20 messages; third party
const s2 = await call('POST', '/auth/register-store', { name: 'QA Other', email: email('other'), password: PW, store: { name: `QA Otra Tienda ${RUN}`, address: 'Calle 9 # 9-9, Cota', phone: '3009998877' } });
const m1 = await call('POST', `/orders/${o1.data.id}/messages`, { text: 'QA: ¿llega mañana? <script>alert(1)</script>' }, S);
const t0 = Date.now();
const dm = await call('GET', `/orders/${o1.data.id}/messages`, undefined, D1);
const seen = arr(dm.data).some((m) => m.text?.startsWith('QA: ¿llega'));
const third = await call('GET', `/orders/${o1.data.id}/messages`, undefined, s2.data?.accessToken);
record('QA-20', 'Message from store, read by distributor; third party reads', [chk('send → 201', m1.status === 201, m1.status), chk(`distributor reads it (${Date.now() - t0} ms)`, seen, dm.status), chk('third party → 403/404', [403, 404].includes(third.status), third.status)]);

// QA-21 mark all read
const ra = await call('POST', '/notifications/read-all', undefined, S);
const un = await call('GET', '/notifications?unread=true', undefined, S);
record('QA-21', 'Mark all notifications read', [chk('read-all → 200/204', [200, 204].includes(ra.status), ra.status), chk('unread = 0', arr(un.data).length === 0, arr(un.data).length)]);

// QA-22 docs
const docs = await fetch(`${API}/docs/`);
const spec = await fetch(`${API}/docs/openapi.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
record('QA-22', 'Open /api/docs in production', [chk('Swagger UI → 200', docs.status === 200, docs.status), chk('spec lists paths', !spec || Object.keys(spec.paths ?? {}).length > 20, spec ? Object.keys(spec.paths).length : 'n/a')]);

// QA-23 injection, XSS stored as text, headers + extra security checks
const inj = await call('POST', '/auth/login', { email: { $gt: '' }, password: { $gt: '' } });
const xss = await call('POST', '/products', { name: '<script>alert(1)</script>', sku: `XSS-${RUN}`, category: 'groceries', unit: 'unit', price: 100, cost: 50, stock: 1, minStock: 0 }, S);
const head = await fetch(`${BASE}/`);
const h = Object.fromEntries(['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'x-powered-by'].map((k) => [k, head.headers.get(k)]));
const apiHead = await fetch(`${API}/health`);
const ah = Object.fromEntries(['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'x-powered-by'].map((k) => [k, apiHead.headers.get(k)]));
record('QA-23', 'NoSQL injection, <script> as text, security headers', [chk('injection login → 400', inj.status === 400, `${inj.status} ${inj.data?.error?.code}`), chk('<script> stored verbatim as text', xss.status === 201 && xss.data?.name === '<script>alert(1)</script>', xss.status), chk('API helmet headers', ah['content-security-policy'] && ah['x-content-type-options'] === 'nosniff' && !ah['x-powered-by'], JSON.stringify(ah))]);
const extra = {
  noToken: (await call('GET', '/products')).status,
  forgedToken: (await call('GET', '/products', undefined, 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4Iiwicm9sZSI6InN0b3JlX293bmVyIn0.')).status,
  crossOrgProduct: (await call('GET', `/products/${gaseosa.id}`, undefined, s2.data?.accessToken)).status,
  cashierDailySummary: (await call('GET', '/sales/summary/daily', undefined, C)).status,
  clientTotalIgnored: (await call('POST', '/sales', { items: [{ product: gaseosa.id, quantity: 1 }], paymentMethod: 'card', total: 1 }, C)).data?.total,
  staticHeaders: h,
  apiHeaders: ah,
};

// QA-25 health
const hl = await call('GET', '/health');
record('QA-25', '/api/health (Vercel)', [chk('status ok, db connected', hl.data?.status === 'ok' && hl.data?.db === 'connected', JSON.stringify(hl.data))]);

// QA-03 rate limit last (locks login from this IP for 15 min)
const codes = [];
for (let i = 0; i < 6; i++) codes.push((await call('POST', '/auth/login', { email: email('ratelimit'), password: 'wrong-password-x' })).status);
qa03.push(chk('6th failed try → 429', codes[5] === 429, codes.join(',')));
record('QA-03', 'Login OK / wrong password / 6 failed tries', qa03);

fs.writeFileSync('qa-results.json', JSON.stringify({ base: BASE, run: RUN, date: new Date().toISOString(), accounts: { owner: email('owner'), cashier: email('cashier'), inventory: email('inventory'), dist1: email('dist1'), dist2: email('dist2'), other: email('other') }, results, extra, log }, null, 2));
console.log('extra', JSON.stringify(extra));
