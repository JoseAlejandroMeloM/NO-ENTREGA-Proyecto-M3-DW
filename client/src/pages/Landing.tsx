import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const MODULES = [
  { title: 'Sales', text: 'Record every sale by card, Nequi or cash, with change and daily totals.' },
  { title: 'Inventory', text: 'Stock levels, best sellers, low-stock alerts and restock suggestions.' },
  { title: 'Distributors', text: 'Compare distributors, send purchase orders, track shipments and chat.' },
];

/** S01 Landing — placeholder until the final design is implemented. */
export default function Landing() {
  const [apiStatus, setApiStatus] = useState('checking…');

  useEffect(() => {
    api<{ status: string; db: string }>('/health')
      .then((h) => setApiStatus(`${h.status} · db ${h.db}`))
      .catch(() => setApiStatus('unreachable'));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold text-primary">Conecta Negocio</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-600">
        One place for neighborhood stores to sell, control their inventory and work with their distributors.
      </p>
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {MODULES.map((m) => (
          <article key={m.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">{m.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{m.text}</p>
          </article>
        ))}
      </section>
      <Link to="/login" className="mt-10 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark">
        Get started
      </Link>
      <p className="mt-6 text-xs text-slate-400">API: {apiStatus}</p>
    </main>
  );
}
