import { Bell, Check } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Badge from '../components/Badge';
import ButtonLink from '../components/ButtonLink';
import Logo from '../components/Logo';

const WRAP = 'mx-auto w-full max-w-6xl px-5 sm:px-8';
const H2 = 'font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl';
// Appears once when the page loads (see "Motion" in DESIGN.md); the global reduced-motion rule turns it off.
const ENTER = 'transition-[opacity,translate] duration-700 starting:translate-y-4 starting:opacity-0';

/** S01 Landing: what the product is, shown with small copies of its own screens, and where to register. */
export default function Landing() {
  const [apiStatus, setApiStatus] = useState('checking…');

  useEffect(() => {
    api<{ status: string; db: string }>('/health')
      .then((h) => setApiStatus(`${h.status} · db ${h.db}`))
      .catch(() => setApiStatus('unreachable'));
  }, []);

  return (
    <div className="bg-canvas">
      <header className="bg-primary-deep text-white">
        <nav aria-label="Main" className={`${WRAP} flex h-18 items-center justify-between gap-4`}>
          <Link to="/" className="focus-visible:outline-accent">
            <Logo onDark />
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink to="/login" variant="inverse">
              Log in
            </ButtonLink>
            <span className="hidden sm:block">
              <ButtonLink to="/register/store" variant="secondary">
                Register a store
              </ButtonLink>
            </span>
          </div>
        </nav>

        <div className={`${WRAP} grid items-center gap-12 pt-10 pb-16 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:pt-0 lg:pb-10`}>
          <div className={ENTER}>
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Sales, stock and supplier orders for your neighborhood store
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-soft/90">
              Conecta Negocio records each sale in cash, card or Nequi, keeps your stock up to date and sends purchase orders to your
              distributors, from the laptop or phone behind the counter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/register/store" variant="secondary" size="lg">
                Register a store
              </ButtonLink>
              <ButtonLink to="/register/distributor" variant="inverse" size="lg">
                Register a distributor
              </ButtonLink>
            </div>
          </div>
          <div className={`${ENTER} delay-150`}>
            <DashboardPreview />
          </div>
        </div>
      </header>

      <main>
        <Feature
          title="Counter sales in cash, card or Nequi"
          text="Search a product, add it to the cart and pick how the customer pays. The app works out the change and takes the units out of stock."
          points={['Totals for the day by payment method', 'Each cashier sees only their own sales']}
        >
          <SalePreview />
        </Feature>
        <Feature
          flip
          title="Stock that warns you before it runs out"
          text="Every product has a minimum. When stock reaches it you get an alert, and the restock list suggests how much to buy from the last 30 days of sales."
          points={['Best sellers and a daily sales chart', 'A history of every stock change']}
        >
          <RestockPreview />
        </Feature>
        <Feature
          title="Purchase orders and chat with your distributors"
          text="Compare prices between distributors, send the order and follow it from accepted to delivered. Each order has its own chat."
          points={['Received orders go straight into stock', 'Rate each delivery from 1 to 5']}
        >
          <OrderPreview />
        </Feature>

        <section className="bg-primary-soft/60 py-20">
          <div className={`${WRAP} flex flex-wrap items-center justify-between gap-8`}>
            <div className="max-w-2xl">
              <h2 className={H2}>Distributors get a catalog and an order inbox</h2>
              <p className="mt-4 text-lg text-slate-700">
                Publish your products with prices and a minimum order. Accept or reject each order, mark it shipped and delivered, and answer
                stores in the order's chat.
              </p>
            </div>
            <ButtonLink to="/register/distributor" size="lg">
              Register a distributor
            </ButtonLink>
          </div>
        </section>

        <section className="bg-primary-deep py-24 text-white">
          <div className={`${WRAP} text-center`}>
            <h2 className={`${H2} mx-auto max-w-2xl`}>Register your store and record its first sale today</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-soft/90">
              You sign up as the owner and add your cashier and inventory clerk afterwards, each with their own account.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/register/store" variant="secondary" size="lg">
                Register a store
              </ButtonLink>
              <ButtonLink to="/login" variant="inverse" size="lg">
                Log in
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 text-sm text-slate-600">
        <div className={`${WRAP} flex flex-wrap items-start justify-between gap-6`}>
          <div>
            <Logo />
            <p className="mt-3 max-w-sm">Final project for Desarrollo de Aplicaciones Web, Universidad de La Sabana, 2026.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/login" className="font-medium text-primary-dark hover:underline">
              Log in
            </Link>
            <Link to="/register/store" className="font-medium text-primary-dark hover:underline">
              Register a store
            </Link>
            <Link to="/register/distributor" className="font-medium text-primary-dark hover:underline">
              Register a distributor
            </Link>
            <a href="/api/docs" className="font-medium text-primary-dark hover:underline">
              API docs
            </a>
          </div>
          <p className="w-full text-xs">API: {apiStatus}</p>
        </div>
      </footer>
    </div>
  );
}

/** One product area: copy on one side, a small copy of the real screen on the other. */
function Feature({ title, text, points, flip, children }: { title: string; text: string; points: string[]; flip?: boolean; children: ReactNode }) {
  return (
    <section className="py-20 lg:py-28">
      <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-20`}>
        <div className={flip ? 'lg:order-2' : ''}>
          <h2 className={H2}>{title}</h2>
          <p className="mt-4 text-lg text-slate-700">{text}</p>
          <ul className="mt-6 space-y-2 text-slate-700">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        {children}
      </div>
    </section>
  );
}

// The previews below are static copies of the app's screens with demo data. They are pictures for
// sighted users, so they are hidden from screen readers; the text next to them says the same.

function Preview({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={`rounded-2xl border border-slate-200 text-sm text-slate-900 shadow-overlay select-none ${className}`}>
      {children}
    </div>
  );
}

function DashboardPreview() {
  return (
    <Preview className="bg-canvas">
      <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-5 py-3">
        <div>
          <p className="font-display font-semibold">Tienda Doña Rosa</p>
          <p className="text-xs text-slate-600">Rosa Pérez · Store owner</p>
        </div>
        <span className="relative text-slate-600">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-2 -right-2 min-w-4 rounded-full bg-accent px-1 text-center text-[0.625rem] leading-4 font-semibold text-slate-950">3</span>
        </span>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="card p-4 sm:col-span-2">
          <p className="text-slate-600">Today's sales · 12</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">$ 234.200</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
            {[
              ['Cash', '$ 102.900'],
              ['Nequi', '$ 89.500'],
              ['Card', '$ 41.800'],
            ].map(([method, total]) => (
              <div key={method}>
                <dt className="text-slate-600">{method}</dt>
                <dd className="font-medium tabular-nums">{total}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="card p-4">
          <p className="text-slate-600">Low-stock products</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-amber-700 tabular-nums">3</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-600">Open purchase orders</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">3</p>
          <p className="mt-1 text-xs text-slate-600">1 in transit</p>
        </div>
      </div>
    </Preview>
  );
}

function SalePreview() {
  return (
    <Preview className="bg-white p-5">
      <ul className="divide-y divide-slate-100">
        {[
          ['2 × Gaseosa Postobón 1.5 L', '$ 9.000'],
          ['1 × Arroz Diana 500 g', '$ 2.800'],
          ['1 × Huevos AA x 30', '$ 21.000'],
        ].map(([line, total]) => (
          <li key={line} className="flex justify-between gap-4 py-2.5">
            <span>{line}</span>
            <span className="tabular-nums">{total}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center font-medium">
        <span className="rounded-lg border border-primary bg-primary-soft py-2.5 text-primary-dark">Cash</span>
        <span className="rounded-lg border border-slate-300 py-2.5">Card</span>
        <span className="rounded-lg border border-slate-300 py-2.5">Nequi</span>
      </div>
      <dl className="mt-4 space-y-1.5">
        <div className="flex justify-between text-slate-600">
          <dt>Received</dt>
          <dd className="tabular-nums">$ 40.000</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="font-medium">Total</dt>
          <dd className="text-3xl font-semibold tracking-tight tabular-nums">$ 32.800</dd>
        </div>
        <div className="flex justify-between rounded-lg bg-green-50 px-3 py-2 font-medium text-green-800">
          <dt>Change</dt>
          <dd className="tabular-nums">$ 7.200</dd>
        </div>
      </dl>
    </Preview>
  );
}

function RestockPreview() {
  const rows: [string, string, 'danger' | 'warning' | 'success', string, string][] = [
    ['Leche Alquería 1 L', '0 Unit', 'danger', 'Out of stock', '36'],
    ['Café Sello Rojo 250 g', '3 Unit', 'warning', 'Low', '12'],
    ['Pan tajado Bimbo', '4 Unit', 'warning', 'Low', '18'],
    ['Arroz Diana 500 g', '44 Unit', 'success', 'OK', '–'],
  ];
  return (
    <Preview className="bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600 uppercase">
          <tr>
            <th className="rounded-tl-2xl px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="rounded-tr-2xl px-4 py-3 text-right font-medium">Suggested</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(([name, stock, tone, label, qty]) => (
            <tr key={name}>
              <td className="px-4 py-3 font-medium">{name}</td>
              <td className="px-4 py-3">
                <span className="mr-2">{stock}</span>
                <Badge tone={tone}>{label}</Badge>
              </td>
              <td className="px-4 py-3 text-right font-medium">{qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Preview>
  );
}

function OrderPreview() {
  const steps = ['Pending', 'Accepted', 'Shipped', 'Delivered'];
  return (
    <Preview className="bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold">PO-000002</p>
        <Badge tone="warning">Shipped</Badge>
      </div>
      <p className="text-slate-600">Campo Fresco · $ 120.000</p>
      <ol className="mt-5 grid grid-cols-4 text-xs">
        {steps.map((step, i) => (
          <li key={step} className={`border-t-2 pt-2 ${i < 3 ? 'border-primary font-medium text-primary-dark' : 'border-slate-200 text-slate-600'}`}>
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-5 space-y-2">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-white">¿A qué hora llega el pedido mañana?</p>
        <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2">Entre 8 y 9 am. El conductor es Jairo.</p>
      </div>
    </Preview>
  );
}
