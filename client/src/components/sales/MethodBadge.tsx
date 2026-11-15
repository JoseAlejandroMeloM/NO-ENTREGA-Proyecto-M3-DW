import Badge from '../Badge';
import { METHOD_LABEL, type PaymentMethod } from '../../types/sale';

const TONE = { card: 'info', nequi: 'warning', cash: 'success' } as const;

export default function MethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge tone={TONE[method]}>{METHOD_LABEL[method]}</Badge>;
}
