import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { Sale } from '../../types/sale';
import { formatCOP } from '../../utils/money';
import Badge from '../Badge';
import MethodBadge from './MethodBadge';
import VoidSalePanel from './VoidSalePanel';

/** Sale detail on S09 (US-21 AC2): items, total, method, cashier and time; the owner can void it. */
export default function SaleDrawer({
  sale,
  onClose,
  canVoid = false,
  onVoided,
}: {
  sale: Sale;
  onClose: () => void;
  canVoid?: boolean;
  onVoided?: (sale: Sale) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/40 transition-opacity duration-300 starting:opacity-0" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sale detail"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-overlay transition-[translate] duration-300 starting:translate-x-full"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sale detail</h2>
            <p className="text-sm text-slate-600">{new Date(sale.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className={`mt-5 text-4xl font-semibold tracking-tight tabular-nums ${sale.voidedAt ? 'text-slate-400 line-through' : ''}`}>
          {formatCOP(sale.total)}
        </p>
        {sale.voidedAt && (
          <div className="mt-3 space-y-1 text-sm">
            <Badge tone="danger">Voided</Badge>
            <p className="text-slate-600">
              {new Date(sale.voidedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} · {sale.voidReason}
            </p>
          </div>
        )}
        <dl className="mt-5 grid grid-cols-2 gap-y-2.5 rounded-xl bg-slate-50 p-4 text-sm">
          <dt className="text-slate-600">Cashier</dt>
          <dd className="text-right font-medium">{sale.cashier?.name ?? '—'}</dd>
          <dt className="text-slate-600">Payment</dt>
          <dd className="text-right">
            <MethodBadge method={sale.paymentMethod} />
          </dd>
          {sale.amountReceived !== null && (
            <>
              <dt className="text-slate-600">Received</dt>
              <dd className="text-right font-medium tabular-nums">{formatCOP(sale.amountReceived)}</dd>
              <dt className="text-slate-600">Change</dt>
              <dd className="text-right font-medium tabular-nums">{formatCOP(sale.change ?? 0)}</dd>
            </>
          )}
        </dl>
        <table className="mt-6 w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs text-slate-600 uppercase">
            <tr>
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((i) => (
              <tr key={i.product}>
                <td className="py-2">
                  {i.name}
                  <span className="block text-xs text-slate-600">{i.sku}</span>
                </td>
                <td className="py-2 text-right tabular-nums">{i.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatCOP(i.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{formatCOP(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 font-semibold">
              <td className="py-2" colSpan={3}>
                Total
              </td>
              <td className="py-2 text-right tabular-nums">{formatCOP(sale.total)}</td>
            </tr>
          </tfoot>
        </table>
        {canVoid && !sale.voidedAt && onVoided && <VoidSalePanel sale={sale} onVoided={onVoided} />}
      </aside>
    </div>
  );
}
