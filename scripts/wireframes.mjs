// Generates low-fidelity wireframes (grayscale SVG, 1440 px wide) for every screen in
// docs/spec/06-screens.md. Import into Figma by dragging the files onto the "1 · Wireframes" page.
// Usage: node scripts/wireframes.mjs  →  docs/figma-import/wireframes/*.svg
/* global console */
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/figma-import/wireframes';
const W = 1440;
const C = { line: '#9a9a9a', box: '#f2f2f2', dark: '#d6d6d6', text: '#333', muted: '#888', white: '#fff' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rect = (x, y, w, h, fill = C.white, r = 6, stroke = C.line) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text = (x, y, s, size = 14, weight = 400, fill = C.text, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="Inter, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
const bar = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="10" rx="5" fill="${C.dark}"/>`;
const button = (x, y, label, primary = false) => {
  const w = label.length * 8 + 32;
  return { w, svg: rect(x, y, w, 36, primary ? '#555' : C.white) + text(x + w / 2, y + 23, label, 13, 600, primary ? C.white : C.text, 'middle') };
};

// Block renderers: each returns { h, svg } for a box at (x, y) with width w.
const blocks = {
  h: ([title, ...actions], x, y, w) => {
    let svg = text(x, y + 30, title, 26, 700), bx = x + w;
    for (const a of [...actions].reverse()) { const b = button(0, 0, a.replace('*', ''), a.startsWith('*')); bx -= b.w + 8; svg += button(bx, y + 8, a.replace('*', ''), a.startsWith('*')).svg; }
    return { h: 56, svg };
  },
  stat: ([label], x, y, w) => ({ h: 104, svg: rect(x, y, w, 104) + text(x + 20, y + 32, label, 13, 400, C.muted) + text(x + 20, y + 74, '$ 000.000', 26, 700) }),
  tabs: (labels, x, y) => {
    let svg = '', tx = x;
    labels.forEach((l, i) => { const tw = l.length * 8 + 28; svg += rect(tx, y, tw, 34, i === 0 ? C.dark : C.white, 17) + text(tx + tw / 2, y + 22, l, 13, 500, C.text, 'middle'); tx += tw + 8; });
    return { h: 34, svg };
  },
  filters: (labels, x, y, w) => {
    let svg = '', fx = x; const fw = (w - (labels.length - 1) * 12) / labels.length;
    for (const l of labels) { svg += rect(fx, y, fw, 40) + text(fx + 14, y + 25, l, 13, 400, C.muted); fx += fw + 12; }
    return { h: 40, svg };
  },
  table: ([title, cols, n = 5], x, y, w) => {
    const top = title ? 48 : 0, h = top + 44 + n * 48;
    let svg = rect(x, y, w, h) + (title ? text(x + 20, y + 30, title, 16, 600) : '');
    const cw = w / cols.length;
    svg += `<rect x="${x + 1}" y="${y + top}" width="${w - 2}" height="44" fill="${C.box}"/>`;
    cols.forEach((c, i) => (svg += text(x + 20 + i * cw, y + top + 27, c.toUpperCase(), 11, 600, C.muted)));
    for (let r = 0; r < n; r++) {
      const ry = y + top + 44 + r * 48;
      svg += `<line x1="${x}" x2="${x + w}" y1="${ry}" y2="${ry}" stroke="#ddd"/>`;
      cols.forEach((c, i) => (svg += bar(x + 20 + i * cw, ry + 19, Math.min(cw - 40, 60 + ((r * 37 + i * 23) % 70)))));
    }
    return { h, svg };
  },
  form: ([title, fields, actions = []], x, y, w) => {
    const cols = w > 600 ? 2 : 1, rows = Math.ceil(fields.length / cols), fw = (w - 40 - (cols - 1) * 16) / cols;
    const h = 56 + rows * 72 + (actions.length ? 56 : 0) + 8;
    let svg = rect(x, y, w, h) + text(x + 20, y + 34, title, 16, 600);
    fields.forEach((f, i) => {
      const fx = x + 20 + (i % cols) * (fw + 16), fy = y + 56 + Math.floor(i / cols) * 72;
      svg += text(fx, fy + 12, f, 12, 500) + rect(fx, fy + 20, fw, 40, C.white, 6, '#bbb');
    });
    let bx = x + 20;
    for (const a of actions) { const b = button(bx, y + h - 56, a.replace('*', ''), a.startsWith('*')); svg += b.svg; bx += b.w + 8; }
    return { h, svg };
  },
  panel: ([title, lines = [], minH = 0], x, y, w) => {
    const h = Math.max(minH, 56 + lines.length * 32 + 8);
    let svg = rect(x, y, w, h) + text(x + 20, y + 34, title, 16, 600);
    lines.forEach((l, i) => (svg += l === '-' ? bar(x + 20, y + 62 + i * 32, w * 0.6) : text(x + 20, y + 72 + i * 32, l, 13, 400, C.muted)));
    return { h, svg };
  },
  chart: ([title], x, y, w) => {
    let svg = rect(x, y, w, 280) + text(x + 20, y + 34, title, 16, 600);
    const n = 14, bw = (w - 60) / n;
    for (let i = 0; i < n; i++) { const bh = 40 + ((i * 53) % 150); svg += `<rect x="${x + 30 + i * bw}" y="${y + 250 - bh}" width="${bw - 10}" height="${bh}" fill="${C.dark}"/>`; }
    return { h: 280, svg };
  },
  chat: ([title], x, y, w) => {
    let svg = rect(x, y, w, 320) + text(x + 20, y + 34, title, 16, 600);
    svg += rect(x + 20, y + 60, w * 0.6, 44, C.box, 12) + rect(x + w * 0.4 - 20, y + 120, w * 0.6, 44, C.dark, 12);
    svg += rect(x + 20, y + 230, w - 40, 44, C.white, 6, '#bbb') + text(x + 34, y + 257, 'Write a message…', 13, 400, C.muted);
    return { h: 320, svg };
  },
  timeline: ([title, steps], x, y, w) => {
    const h = 56 + steps.length * 44;
    let svg = rect(x, y, w, h) + text(x + 20, y + 34, title, 16, 600);
    steps.forEach((s, i) => (svg += `<circle cx="${x + 32}" cy="${y + 72 + i * 44}" r="10" fill="${i === 0 ? '#555' : C.white}" stroke="${C.line}"/>` + text(x + 54, y + 77 + i * 44, s, 13)));
    return { h, svg };
  },
  note: ([s], x, y) => ({ h: 24, svg: text(x, y + 16, s, 13, 400, C.muted) }),
};

// Renders rows of blocks: each row is [[kind, args, flex], ...] laid out side by side.
function renderRows(rows, x0, y0, width) {
  let y = y0, svg = '';
  for (const row of rows) {
    const total = row.reduce((s, b) => s + (b[2] ?? 1), 0), gap = 20;
    let x = x0, rowH = 0;
    // Stacked column: a block whose kind is 'col' renders its own rows inside the column.
    for (const [kind, args, flex = 1] of row) {
      const w = (width - gap * (row.length - 1)) * (flex / total);
      const r = kind === 'col' ? (() => { const c = renderRows(args, x, y, w); return { h: c.y - y - 20, svg: c.svg }; })() : blocks[kind](args, x, y, w);
      svg += r.svg; rowH = Math.max(rowH, r.h); x += w + gap;
    }
    y += rowH + 20;
  }
  return { svg, y };
}

const STORE_NAV = ['Dashboard', 'New sale', 'Sales', 'Products', 'Insights', 'Restock', 'Orders', 'Distributors', 'Compare', 'Team', 'Store profile', 'Notifications'];
const DIST_NAV = ['Dashboard', 'Orders', 'Catalog', 'Team', 'Company profile', 'Notifications'];

function appShell(nav, active, org, rows) {
  const body = renderRows(rows, 280, 100, 1120);
  const h = Math.max(900, body.y + 20);
  let svg = `<rect width="${W}" height="${h}" fill="${C.box}"/>` + `<rect width="240" height="${h}" fill="#e4e4e4"/>`;
  svg += `<circle cx="34" cy="32" r="10" fill="#999"/>` + text(54, 37, 'Conecta Negocio', 16, 700);
  nav.forEach((n, i) => { const y = 76 + i * 40; if (n === active) svg += rect(12, y - 4, 216, 34, '#cfcfcf', 6, 'none'); svg += `<rect x="26" y="${y + 6}" width="14" height="14" rx="3" fill="#aaa"/>` + text(52, y + 18, n, 14, n === active ? 600 : 400); });
  svg += `<rect x="240" width="${W - 240}" height="64" fill="${C.white}" stroke="#ddd"/>` + text(272, 30, org, 15, 600) + text(272, 48, 'User name · Role', 12, 400, C.muted);
  svg += `<circle cx="1228" cy="32" r="12" fill="${C.dark}"/>` + `<circle cx="1274" cy="32" r="16" fill="${C.dark}"/>` + button(1300, 14, 'Log out').svg;
  return { h, svg: svg + body.svg };
}

function authShell(title, rows) {
  let svg = `<rect width="${W}" height="900" fill="${C.white}"/>` + `<rect width="560" height="900" fill="#d9d9d9"/>`;
  svg += text(60, 70, 'Conecta Negocio', 20, 700) + text(60, 360, 'Brand panel: product promise', 30, 700) + ['Fact 1 — sales by payment method', 'Fact 2 — restock suggestions', 'Fact 3 — order from distributors'].map((f, i) => `<circle cx="70" cy="${426 + i * 40}" r="6" fill="#999"/>` + text(88, 431 + i * 40, f, 15, 400, C.text)).join('');
  svg += text(680, 140, title, 28, 700);
  return { h: 900, svg: svg + renderRows(rows, 680, 170, 640).svg };
}

const S = {
  'S01-landing': () => {
    let svg = `<rect width="${W}" height="1900" fill="${C.white}"/>` + text(80, 44, 'Conecta Negocio', 18, 700) + button(1150, 20, 'Log in').svg + button(1240, 20, 'Register', true).svg;
    svg += `<rect y="80" width="${W}" height="560" fill="#d9d9d9"/>` + text(80, 220, 'Headline: sales, stock and suppliers', 44, 700) + text(80, 274, 'for neighborhood stores', 44, 700) + text(80, 320, 'Sub-headline: one sentence on what the app does', 18, 400, C.muted);
    svg += button(80, 360, "I'm a store", true).svg + button(220, 360, "I'm a distributor").svg + rect(780, 140, 580, 440, C.box, 12) + text(1070, 365, 'Product screenshot (dashboard)', 15, 500, C.muted, 'middle');
    svg += text(720, 720, 'Three modules', 28, 700, C.text, 'middle');
    ['Sell — POS with card / Nequi / cash', 'Restock — best sellers and suggestions', 'Order — compare distributors, chat'].forEach((m, i) => (svg += rect(80 + i * 440, 760, 400, 260, C.box, 10) + rect(100 + i * 440, 780, 360, 150, C.dark, 6) + text(100 + i * 440, 966, m, 15, 600)));
    svg += `<rect y="1080" width="${W}" height="380" fill="${C.box}"/>` + text(80, 1170, 'Band for distributors: publish a catalog, receive orders', 26, 700) + rect(780, 1120, 580, 300, C.dark, 10) + button(80, 1210, 'Register as distributor', true).svg;
    svg += text(720, 1560, 'Closing band: call to action', 28, 700, C.text, 'middle') + button(660, 1590, 'Get started', true).svg;
    svg += `<rect y="1720" width="${W}" height="180" fill="#e4e4e4"/>` + text(80, 1780, 'Footer · links · API status: online', 14, 400, C.muted);
    return { h: 1900, svg };
  },
  'S02-login': () => authShell('Log in', [[['form', ['', ['Email', 'Password'], ['*Log in']]]], [['note', ['Error message area · "Invalid credentials"']]], [['note', ['No account? Register a store · Register a distributor']]]]),
  'S03-register-store': () => authShell('Register your store', [[['tabs', ['Store', 'Distributor']]], [['form', ['You', ['Full name', 'Email', 'Password', 'Phone']]]], [['form', ['Store', ['Store name', 'Address', 'City', 'NIT (optional)'], ['*Create account']]]]]),
  'S04-register-distributor': () => authShell('Register your company', [[['tabs', ['Distributor', 'Store']]], [['form', ['You', ['Full name', 'Email', 'Password', 'Phone']]]], [['form', ['Company', ['Company name', 'NIT', 'Delivery days', 'Minimum order', 'Coverage zones'], ['*Create account']]]]]),
  'S05-store-dashboard': () => appShell(STORE_NAV, 'Dashboard', 'Store name', [[['h', ['Dashboard', 'New sale*'.replace(/(.*)\*/, '*$1')]]], [['stat', ['Today · cash']], ['stat', ['Today · card']], ['stat', ['Today · Nequi']], ['stat', ['Low-stock products']]], [['panel', ['Open purchase orders', ['-', '-', '-']]], ['panel', ['Unread messages', ['-', '-']]]], [['panel', ['Quick actions', ['New sale · Add product · Restock']]]]]),
  'S06-products': () => appShell(STORE_NAV, 'Products', 'Store name', [[['h', ['Products', '*Add product']]], [['filters', ['Search by name or barcode', 'Category', 'Low stock only']]], [['table', ['', ['Product', 'Category', 'Price', 'Stock', 'Min', ''], 8]]]]),
  'S07-product-form': () => appShell(STORE_NAV, 'Products', 'Store name', [[['h', ['Edit product', 'Delete', '*Save']]], [['form', ['Product', ['Name', 'Barcode', 'Category', 'Unit', 'Price', 'Cost', 'Minimum stock'], []], 2], ['col', [[['form', ['Adjust stock', ['Quantity (+/-)', 'Reason'], ['*Apply']]]], [['panel', ['Movement history', ['-', '-', '-', '-']]]]], 1]]]),
  'S08-new-sale': () => appShell(STORE_NAV, 'New sale', 'Store name', [[['h', ['New sale']]], [['col', [[['filters', ['Search product']]], [['table', ['Results', ['Product', 'Price', 'Stock', ''], 6]]]], 2], ['col', [[['table', ['Cart', ['Item', 'Qty', 'Subtotal'], 3]]], [['tabs', ['Cash', 'Card', 'Nequi']]], [['form', ['Payment', ['Amount received', 'Change'], ['*Charge $ 00.000']]]]], 1]]]),
  'S09-sales-history': () => appShell(STORE_NAV, 'Sales', 'Store name', [[['h', ['Sales history']]], [['filters', ['From date', 'To date', 'Payment method', 'Cashier']]], [['table', ['', ['Code', 'Date', 'Cashier', 'Method', 'Total', 'Status'], 8]]], [['note', ['Row click → sale detail drawer (items, void sale for owner)']]]]),
  'S10-insights': () => appShell(STORE_NAV, 'Insights', 'Store name', [[['h', ['Insights']]], [['tabs', ['7 days', '30 days', '90 days']]], [['chart', ['Daily sales']]], [['table', ['Top 10 by units', ['Product', 'Units', 'Revenue'], 5]], ['table', ['Top 10 by revenue', ['Product', 'Units', 'Revenue'], 5]]]]),
  'S11-restock': () => appShell(STORE_NAV, 'Restock', 'Store name', [[['h', ['Restock suggestions']]], [['note', ['Sorted by urgency: days left = stock ÷ average units per day']]], [['table', ['', ['Product', 'Stock', 'Avg/day', 'Days left', 'Suggested', 'Best distributor', ''], 8]]]]),
  'S12-distributors': () => appShell(STORE_NAV, 'Distributors', 'Store name', [[['h', ['Distributors']]], [['filters', ['Search distributor', 'Category']]], [['panel', ['Distributor A', ['★ 4.5 · 2 delivery days', 'Minimum $ 100.000', 'Categories']]], ['panel', ['Distributor B', ['★ 4.0 · 3 delivery days', 'Minimum $ 80.000', 'Categories']]], ['panel', ['Distributor C', ['★ 4.8 · 1 delivery day', 'Minimum $ 150.000', 'Categories']]]]]),
  'S13-distributor-profile': () => appShell(STORE_NAV, 'Distributors', 'Store name', [[['h', ['Distributor name', '*New order']]], [['panel', ['Profile', ['Rating ★ · delivery days · minimum order · coverage']]]], [['table', ['Catalog', ['Item', 'Category', 'Unit', 'Price', ''], 6]]]]),
  'S14-compare': () => appShell(STORE_NAV, 'Compare', 'Store name', [[['h', ['Compare distributors']]], [['filters', ['Product or category', 'Sort: price / delivery / rating']]], [['table', ['', ['Distributor', 'Item', 'Price', 'Delivery', 'Rating', ''], 5]]]]),
  'S15-new-order': () => appShell(STORE_NAV, 'Orders', 'Store name', [[['h', ['New purchase order', '*Send order']]], [['panel', ['Distributor', ['Name · minimum order · delivery days']]]], [['table', ['Items', ['Item', 'Unit price', 'Quantity', 'Subtotal', ''], 4], 2], ['panel', ['Summary', ['Total', 'Minimum order: progress bar', 'Note for the distributor']], 1]]]),
  'S16-orders-store': () => appShell(STORE_NAV, 'Orders', 'Store name', [[['h', ['Purchase orders', '*New order']]], [['tabs', ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled']]], [['table', ['', ['Code', 'Distributor', 'Date', 'Total', 'Status'], 7]]]]),
  'S17-order-detail-store': () => appShell(STORE_NAV, 'Orders', 'Store name', [[['h', ['PO-000001', 'Cancel', '*Receive']]], [['col', [[['table', ['Items', ['Item', 'Qty', 'Unit price', 'Subtotal'], 3]]], [['panel', ['Rate this order', ['★★★★★ · comment']]]]], 2], ['col', [[['timeline', ['Tracking', ['Pending', 'Accepted', 'Shipped', 'Delivered']]]], [['chat', ['Messages']]]], 1]]]),
  'S18-team-store': () => appShell(STORE_NAV, 'Team', 'Store name', [[['h', ['Team', '*Add employee']]], [['table', ['', ['Name', 'Email', 'Role', 'Status', ''], 4]]], [['note', ['"Add employee" opens a modal: name, email, password, role (inventory / cashier)']]]]),
  'S19-distributor-dashboard': () => appShell(DIST_NAV, 'Dashboard', 'Distributor name', [[['h', ['Dashboard']]], [['stat', ['New orders']], ['stat', ['In transit']], ['stat', ['Rating']], ['stat', ['Unread messages']]], [['table', ['New orders', ['Code', 'Store', 'Date', 'Total', ''], 4], 2], ['panel', ['Unread messages', ['-', '-', '-']], 1]]]),
  'S20-catalog': () => appShell(DIST_NAV, 'Catalog', 'Distributor name', [[['h', ['Catalog', '*Add item']]], [['filters', ['Search item', 'Category']]], [['table', ['', ['Item', 'Category', 'Unit', 'Price', 'Available', ''], 7]]], [['note', ['"Add item" / edit opens a modal; the Available switch hides an item from stores']]]]),
  'S21-incoming-orders': () => appShell(DIST_NAV, 'Orders', 'Distributor name', [[['h', ['Orders']]], [['tabs', ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Rejected']]], [['table', ['', ['Code', 'Store', 'Date', 'Total', 'Status'], 7]]]]),
  'S22-order-detail-distributor': () => appShell(DIST_NAV, 'Orders', 'Distributor name', [[['h', ['PO-000001', 'Reject', '*Accept']]], [['col', [[['table', ['Items', ['Item', 'Qty', 'Unit price', 'Subtotal'], 3]]], [['panel', ['Note from the store', ['-']]]]], 2], ['col', [[['timeline', ['Tracking', ['Pending', 'Accepted', 'Shipped', 'Delivered']]]], [['chat', ['Messages']]]], 1]]]),
  'S23-company-profile': () => appShell(DIST_NAV, 'Company profile', 'Distributor name', [[['h', ['Company profile', '*Save']]], [['form', ['Company', ['Company name', 'NIT', 'Phone', 'Address', 'Delivery days', 'Minimum order', 'Coverage zones']]]]]),
  'S24-team-distributor': () => appShell(DIST_NAV, 'Team', 'Distributor name', [[['h', ['Team', '*Add staff']]], [['table', ['', ['Name', 'Email', 'Role', 'Status', ''], 4]]], [['note', ['"Add staff" opens a modal: name, email, password']]]]),
  'S25-notifications': () => appShell(DIST_NAV, 'Notifications', 'Organization name', [[['h', ['Notifications', 'Mark all read']]], [['tabs', ['All', 'Unread']]], [['table', ['', ['Notification', 'Type', 'When'], 8]]], [['note', ['The bell in the top bar shows the latest 5 and the unread count']]]]),
  'S26-403-404': () => {
    let svg = `<rect width="${W}" height="900" fill="${C.white}"/>`;
    for (const [cx, code, msg] of [[400, '403', "You don't have access to this page"], [1040, '404', "We couldn't find this page"]]) {
      svg += rect(cx - 280, 220, 560, 420, C.box, 12) + text(cx, 300, 'Conecta Negocio', 16, 700, C.text, 'middle') + text(cx, 400, code, 72, 700, '#666', 'middle') + text(cx, 450, msg, 20, 600, C.text, 'middle') + text(cx, 480, 'One line explaining what to do next', 14, 400, C.muted, 'middle') + button(cx - 70, 520, 'Go to my home', true).svg;
    }
    return { h: 900, svg };
  },
};

mkdirSync(OUT, { recursive: true });
for (const [name, build] of Object.entries(S)) {
  const { h, svg } = build();
  writeFileSync(`${OUT}/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">${svg}</svg>\n`);
}
console.log(`${Object.keys(S).length} wireframes in ${OUT}`);
