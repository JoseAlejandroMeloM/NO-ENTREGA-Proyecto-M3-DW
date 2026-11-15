import { useEffect } from 'react';
import { METHOD_LABEL, type Sale } from '../../types/sale';
import { formatCOP } from '../../utils/money';

/** Sale detail on S09 (US-21 AC2): items, total, method, cashier and time. */
export default function SaleDrawer({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-900/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sale detail"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sale detail</h2>
            <p className="text-sm text-slate-500">{new Date(sale.createdAt).toLocaleString('es-CO')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Cashier</dt>
          <dd>{sale.cashier?.name ?? '—'}</dd>
          <dt className="text-slate-500">Payment</dt>
          <dd>{METHOD_LABEL[sale.paymentMethod]}</dd>
          {sale.amountReceived !== null && (
            <>
              <dt className="text-slate-500">Received</dt>
              <dd className="tabular-nums">{formatCOP(sale.amountReceived)}</dd>
              <dt className="text-slate-500">Change</dt>
              <dd className="tabular-nums">{formatCOP(sale.change ?? 0)}</dd>
            </>
          )}
        </dl>
        <table className="mt-6 w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
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
                  <span className="block text-xs text-slate-500">{i.sku}</span>
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
      </aside>
    </div>
  );
}
