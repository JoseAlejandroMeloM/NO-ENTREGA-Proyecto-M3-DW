import { useEffect, useState } from 'react';
import { ApiError, post } from '../../api/client';
import { NOTIFICATIONS_CHANGED } from '../../api/notifications';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import { useApi } from '../../hooks/useApi';
import type { Product, ProductPage } from '../../types/product';
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod, type Sale } from '../../types/sale';
import { formatCOP } from '../../utils/money';

interface Line {
  product: Product;
  quantity: number;
}

/**
 * S08 New sale (US-20), the annotated screen. Prices shown here are a preview:
 * the server prices every line again and decides the total, change and stock.
 */
export default function NewSalePage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Line[]>([]);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [received, setReceived] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Sale | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);
  const results = useApi<ProductPage>(`/products?limit=8${query ? `&q=${encodeURIComponent(query)}` : ''}`);

  const total = cart.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const receivedNum = received.trim() === '' ? null : Number(received);
  const change = method === 'cash' && receivedNum !== null ? receivedNum - total : null;

  const add = (product: Product) =>
    setCart((c) => {
      const line = c.find((l) => l.product.id === product.id);
      if (line) return c.map((l) => (l === line ? { ...l, quantity: Math.min(l.quantity + 1, product.stock) } : l));
      return [...c, { product, quantity: 1 }];
    });
  const setQty = (id: string, quantity: number) =>
    setCart((c) => c.map((l) => (l.product.id === id ? { ...l, quantity: Math.max(1, Math.min(quantity, l.product.stock)) } : l)));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.product.id !== id));

  const reset = () => {
    setCart([]);
    setMethod(null);
    setReceived('');
    setErrors([]);
    setFieldError(null);
    setDone(null);
    results.reload(); // fresh stock numbers for the next sale
  };

  const submit = async () => {
    setErrors([]);
    setFieldError(null);
    if (!method) return setErrors(['Choose a payment method.']);
    setSubmitting(true);
    try {
      const sale = await post<Sale>('/sales', {
        items: cart.map((l) => ({ product: l.product.id, quantity: l.quantity })),
        paymentMethod: method,
        ...(method === 'cash' && receivedNum !== null ? { amountReceived: receivedNum } : {}),
      });
      setDone(sale);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)); // the sale may have triggered a low-stock alert
    } catch (err) {
      if (err instanceof ApiError) {
        // 409: stock changed since the product was added (another cashier sold it) → list every short item.
        const amount = err.details.find((d) => d.path === 'amountReceived');
        if (amount) setFieldError(amount.message);
        const others = err.details.filter((d) => d.path !== 'amountReceived').map((d) => d.message);
        setErrors(others.length ? others : amount ? [] : [err.message]);
        if (err.status === 409) results.reload();
      } else {
        setErrors(['Could not reach the server. The sale was not registered.']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="mx-auto max-w-md space-y-4 rounded-xl border border-green-200 bg-white p-6 text-center">
        <p className="text-sm font-medium text-green-700">Sale registered</p>
        <p className="text-4xl font-semibold tabular-nums">{formatCOP(done.total)}</p>
        <p className="text-sm text-slate-600">
          {METHOD_LABEL[done.paymentMethod]} · {done.items.reduce((s, i) => s + i.quantity, 0)} items
        </p>
        {done.change !== null && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-lg">
            Change: <strong className="tabular-nums">{formatCOP(done.change)}</strong>
          </p>
        )}
        <Button onClick={reset} className="w-full">
          New sale
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New sale</h1>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* Product search */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Find a product</span>
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or SKU"
              maxLength={80}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <ul className="divide-y divide-slate-100">
            {results.data?.data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.sku} · {formatCOP(p.price)} · {p.stock === 0 ? 'out of stock' : `${p.stock} in stock`}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => add(p)} disabled={p.stock === 0} aria-label={`Add ${p.name}`}>
                  Add
                </Button>
              </li>
            ))}
            {results.data && results.data.data.length === 0 && <li className="py-4 text-sm text-slate-500">No products found.</li>}
          </ul>
        </div>

        {/* Cart and payment */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Add products from the list.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((l) => (
                <li key={l.product.id} className="flex items-center gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.product.name}</p>
                    <p className="text-xs text-slate-500">{formatCOP(l.product.price)} each</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={l.product.stock}
                    value={l.quantity}
                    onChange={(e) => setQty(l.product.id, Number(e.target.value) || 1)}
                    aria-label={`Quantity of ${l.product.name}`}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right tabular-nums"
                  />
                  <span className="w-24 text-right tabular-nums">{formatCOP(l.product.price * l.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(l.product.id)}
                    aria-label={`Remove ${l.product.name}`}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
            <span className="text-sm text-slate-600">Total</span>
            <span className="text-2xl font-semibold tabular-nums">{formatCOP(total)}</span>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Payment method</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    method === m ? 'border-primary bg-primary-soft text-primary-dark' : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {METHOD_LABEL[m]}
                </button>
              ))}
            </div>
          </fieldset>

          {method === 'cash' && (
            <div className="space-y-1">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Amount received (COP)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  aria-invalid={Boolean(fieldError) || (change !== null && change < 0)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                />
              </label>
              {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
              {change !== null && (
                <p className={`text-sm ${change < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  {change < 0 ? `Missing ${formatCOP(-change)}` : `Change: ${formatCOP(change)}`}
                </p>
              )}
            </div>
          )}

          {errors.length > 0 && <FormAlert message={errors.join(' ')} />}

          <Button
            onClick={submit}
            loading={submitting}
            disabled={cart.length === 0 || !method || (method === 'cash' && (change === null || change < 0))}
            className="w-full"
          >
            Register sale
          </Button>
        </div>
      </div>
    </section>
  );
}
