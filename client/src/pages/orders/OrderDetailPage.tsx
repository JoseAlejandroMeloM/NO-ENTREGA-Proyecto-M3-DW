import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import Button from '../../components/Button';
import FormAlert from '../../components/FormAlert';
import MessagesPanel from '../../components/orders/MessagesPanel';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderTimeline from '../../components/orders/OrderTimeline';
import { NOTIFICATIONS_CHANGED } from '../../api/notifications';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import type { OrderStatus, PurchaseOrder } from '../../types/order';
import { UNIT_LABEL } from '../../types/product';
import { formatCOP } from '../../utils/money';

/**
 * S17 (store) and S22 (distributor) order detail: items, timeline and the actions the
 * current role may take (BR5). The API checks every action again.
 */
export default function OrderDetailPage({ side }: { side: 'store' | 'distributor' }) {
  const { id } = useParams();
  const role = useAuth().session?.user.role;
  const { data: order, error, reload } = useApi<PurchaseOrder>(`/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const run = async (path: string, body: object) => {
    setBusy(true);
    setActionError(null);
    try {
      await api(`/orders/${id}${path}`, { method: path === '/status' ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setRejecting(false);
      reload();
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)); // receiving can clear low-stock alerts
    } catch (err) {
      setActionError(err instanceof ApiError ? (err.details[0]?.message ?? err.message) : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };
  const setStatus = (status: OrderStatus, note?: string) => run('/status', { status, ...(note ? { note } : {}) });

  const back = side === 'store' ? '/app/orders' : '/dist/orders';
  if (!order) {
    return (
      <section className="space-y-4">
        <Link to={back} className="text-sm text-primary hover:underline">
          ← Orders
        </Link>
        <FormAlert message={error} />
        {!error && <p className="text-sm text-slate-500">Loading…</p>}
      </section>
    );
  }

  const isOwner = role === 'distributor_owner';
  const canReceive = side === 'store' && order.status === 'delivered' && !order.receivedAt;
  const canRate = side === 'store' && role === 'store_owner' && order.status === 'delivered' && !order.rated;

  return (
    <section className="space-y-4">
      <Link to={back} className="text-sm text-primary hover:underline">
        ← Orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold">
            {order.code} <OrderStatusBadge status={order.status} />
          </h1>
          <p className="text-sm text-slate-600">
            {side === 'store' ? (
              <>
                To <Link to={`/app/distributors/${order.distributor.id}`} className="text-primary hover:underline">{order.distributor.name}</Link>
              </>
            ) : (
              <>From {order.store.name}</>
            )}{' '}
            · {new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {side === 'store' && order.status === 'pending' && (
            <Button variant="danger" loading={busy} onClick={() => window.confirm(`Cancel order ${order.code}?`) && setStatus('cancelled')}>
              Cancel order
            </Button>
          )}
          {canReceive && (
            <Button loading={busy} onClick={() => run('/receive', {})}>
              Receive into stock
            </Button>
          )}
          {side === 'distributor' && order.status === 'pending' && isOwner && (
            <>
              <Button variant="secondary" disabled={busy} onClick={() => setRejecting(true)}>
                Reject
              </Button>
              <Button loading={busy} onClick={() => setStatus('accepted')}>
                Accept
              </Button>
            </>
          )}
          {side === 'distributor' && order.status === 'accepted' && (
            <Button loading={busy} onClick={() => setStatus('shipped')}>
              Mark shipped
            </Button>
          )}
          {side === 'distributor' && order.status === 'shipped' && (
            <Button loading={busy} onClick={() => setStatus('delivered')}>
              Mark delivered
            </Button>
          )}
        </div>
      </div>

      <FormAlert message={actionError} />

      {side === 'distributor' && order.status === 'pending' && !isOwner && (
        <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">Only the distributor owner can accept or reject orders.</p>
      )}

      {rejecting && (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Why are you rejecting this order?</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              rows={2}
              autoFocus
              className="mt-1 block w-full field"
            />
          </label>
          <div className="flex gap-2">
            <Button variant="danger" loading={busy} onClick={() => setStatus('rejected', reason.trim())}>
              Reject order
            </Button>
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              Keep it
            </Button>
          </div>
        </div>
      )}

      {order.status === 'rejected' && order.rejectReason && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Rejected: {order.rejectReason}</p>
      )}
      {order.receivedAt && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Received into stock on {new Date(order.receivedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}.
          {side === 'store' && ' Items new to your store were added as products priced at cost + 30% — review their sale price.'}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-x-auto card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Unit price</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((i) => (
                  <tr key={i.catalogItem}>
                    <td className="px-4 py-3">
                      {i.name} <span className="text-xs text-slate-500">/ {UNIT_LABEL[i.unit]}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCOP(i.unitPrice)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCOP(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCOP(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {order.note && <p className="rounded-lg bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-200">Note: {order.note}</p>}

          {canRate && (
            <div className="space-y-3 card p-4">
              <p className="font-medium">How was this delivery?</p>
              <div role="radiogroup" aria-label="Stars" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    onClick={() => setStars(n)}
                    className={`text-2xl ${n <= stars ? 'text-accent' : 'text-slate-300'} hover:text-accent`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Comment (optional)"
                aria-label="Comment"
                className="block w-full field"
              />
              <Button disabled={stars === 0} loading={busy} onClick={() => run('/rating', { stars, ...(comment.trim() ? { comment: comment.trim() } : {}) })}>
                Send rating
              </Button>
            </div>
          )}
          {order.rated && side === 'store' && <p className="text-sm text-slate-600">You rated this delivery. Thank you!</p>}
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-3 font-semibold">Tracking</h2>
            <OrderTimeline order={order} />
          </div>
          <MessagesPanel orderId={order.id} mySide={side} />
        </aside>
      </div>
    </section>
  );
}
