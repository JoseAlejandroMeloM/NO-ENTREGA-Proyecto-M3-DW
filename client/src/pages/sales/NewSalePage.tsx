import { Banknote, CircleCheck, CreditCard, Minus, Plus, Search, ShoppingBasket, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, post } from '../../api/client';
import { NOTIFICATIONS_CHANGED } from '../../api/notifications';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import PageHeader from '../../components/PageHeader';
import { useApi } from '../../hooks/useApi';
import type { Product, ProductPage } from '../../types/product';
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod, type Sale } from '../../types/sale';
import { formatCOP } from '../../utils/money';

const METHOD_ICON = { cash: Banknote, card: CreditCard, nequi: Smartphone } as const;
const STEP = 'grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-[background-color,scale] hover:bg-slate-50 active:scale-95 disabled:opacity-40';

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
      <section className="mx-auto max-w-md card space-y-5 p-6 text-center sm:p-8">
        <CircleCheck className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-green-700">Sale registered</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">{formatCOP(done.total)}</p>
          <p className="mt-2 text-sm text-slate-600">
            {METHOD_LABEL[done.paymentMethod]} · {done.items.reduce((s, i) => s + i.quantity, 0)} items
          </p>
        </div>
        {done.change !== null && (
          <p className="flex items-baseline justify-between rounded-xl bg-green-50 px-4 py-3 text-green-900">
            <span className="font-medium">Change</span>
            <strong className="text-3xl font-semibold tracking-tight tabular-nums">{formatCOP(done.change)}</strong>
          </p>
        )}
        <Button onClick={reset} size="lg" className="w-full" autoFocus>
          New sale
        </Button>
      </section>
    );
  }

  const units = cart.reduce((n, l) => n + l.quantity, 0);

  return (
    <section className={`space-y-4 ${cart.length > 0 ? 'pb-16 lg:pb-0' : ''}`}>
      <PageHeader title="New sale" subtitle="Tap a product to add it, then choose how the customer pays." />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Product search */}
        <div className="card space-y-4 p-4">
          <label className="relative block">
            <span className="sr-only">Find a product</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a product by name or SKU"
              maxLength={80}
              className="field block h-12 w-full pl-11 text-base"
            />
          </label>
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.data?.data.map((p) => {
              const inCart = cart.find((l) => l.product.id === p.id)?.quantity;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => add(p)}
                    disabled={p.stock === 0}
                    aria-label={`Add ${p.name}`}
                    className={`relative flex h-full min-h-20 w-full flex-col justify-between gap-2 rounded-xl border p-3 text-left transition-[background-color,border-color,scale] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
                      inCart ? 'border-primary bg-primary-soft/50' : 'border-slate-200 bg-white hover:border-primary/60 hover:bg-slate-50'
                    }`}
                  >
                    <span className="pr-8 text-sm leading-snug font-medium">{p.name}</span>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-semibold tabular-nums">{formatCOP(p.price)}</span>
                      <span className={`text-xs ${p.stock === 0 ? 'font-medium text-red-700' : 'text-slate-600'}`}>
                        {p.stock === 0 ? 'out of stock' : `${p.stock} in stock`}
                      </span>
                    </span>
                    {inCart && (
                      <span className="absolute top-2 right-2 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white tabular-nums">
                        {inCart}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {results.data && results.data.data.length === 0 && <li className="py-6 text-center text-sm text-slate-600 sm:col-span-2">No products found.</li>}
          </ul>
        </div>

        {/* Cart and payment */}
        <div id="cart" className="card scroll-mt-20 space-y-4 p-4 lg:sticky lg:top-20">
          <h2 className="flex items-center justify-between font-semibold">
            Cart
            {units > 0 && <span className="text-sm font-normal text-slate-600">{units} item{units === 1 ? '' : 's'}</span>}
          </h2>
          {cart.length === 0 ? (
            <p className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">
              <ShoppingBasket className="h-6 w-6 text-slate-400" aria-hidden="true" />
              Tap a product to start the sale.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((l) => (
                <li key={l.product.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{l.product.name}</p>
                      <p className="text-xs text-slate-600">{formatCOP(l.product.price)} each</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.product.id)}
                      aria-label={`Remove ${l.product.name}`}
                      className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setQty(l.product.id, l.quantity - 1)} disabled={l.quantity <= 1} aria-label={`One less ${l.product.name}`} className={STEP}>
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={l.product.stock}
                        value={l.quantity}
                        onChange={(e) => setQty(l.product.id, Number(e.target.value) || 1)}
                        aria-label={`Quantity of ${l.product.name}`}
                        className="field h-9 min-h-0 w-14 px-1 text-center tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(l.product.id, l.quantity + 1)}
                        disabled={l.quantity >= l.product.stock}
                        aria-label={`One more ${l.product.name}`}
                        className={STEP}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="text-base font-semibold tabular-nums">{formatCOP(l.product.price * l.quantity)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{formatCOP(total)}</span>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Payment method</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_ICON[m];
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={method === m}
                    onClick={() => setMethod(m)}
                    className={`flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-[background-color,border-color,scale] active:scale-[0.97] ${
                      method === m ? 'border-primary bg-primary-soft text-primary-dark ring-1 ring-primary' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {METHOD_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {method === 'cash' && (
            <div className="space-y-2">
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
                  className="field mt-1.5 block h-12 w-full text-lg tabular-nums"
                />
              </label>
              {fieldError && <p className="text-xs font-medium text-red-700">{fieldError}</p>}
              {change !== null && (
                <p
                  className={`flex items-baseline justify-between rounded-xl px-4 py-3 ${change < 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-900'}`}
                >
                  <span className="font-medium">{change < 0 ? 'Missing' : 'Change'}</span>
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCOP(Math.abs(change))}</span>
                </p>
              )}
            </div>
          )}

          {errors.length > 0 && <FormAlert message={errors.join(' ')} />}

          <Button
            onClick={submit}
            loading={submitting}
            size="lg"
            disabled={cart.length === 0 || !method || (method === 'cash' && (change === null || change < 0))}
            className="w-full"
          >
            Register sale
          </Button>
        </div>
      </div>

      {/* Phones: the cart is below the product list, so keep its total one tap away. */}
      {cart.length > 0 && (
        <a
          href="#cart"
          className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 flex h-12 items-center justify-between rounded-xl bg-primary px-4 font-medium text-white shadow-raised lg:hidden"
        >
          <span>
            View cart · {units} item{units === 1 ? '' : 's'}
          </span>
          <span className="tabular-nums">{formatCOP(total)}</span>
        </a>
      )}
    </section>
  );
}
