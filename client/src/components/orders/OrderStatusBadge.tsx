import Badge from '../Badge';
import { STATUS_LABEL, type OrderStatus } from '../../types/order';

// Status colors from 06-screens.md: pending gray, accepted blue, shipped amber, delivered green, rejected/cancelled red.
const TONE = {
  pending: 'neutral',
  accepted: 'info',
  shipped: 'warning',
  delivered: 'success',
  rejected: 'danger',
  cancelled: 'danger',
} as const;

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
