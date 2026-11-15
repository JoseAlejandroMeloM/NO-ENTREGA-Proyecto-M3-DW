import mongoose from 'mongoose';
import { z } from 'zod';
import type { AuthUser } from '../../middleware/auth';
import { Message, toMessageDto } from '../../models/Message';
import { PurchaseOrder } from '../../models/PurchaseOrder';
import { notFoundError } from '../../utils/errors';
import { notify } from '../notifications/service';

export const messageSchema = z.object({
  text: z.string({ error: 'Write a message' }).trim().min(1, 'Write a message').max(1000, 'Messages can have at most 1000 characters'),
});
export const messagesQuery = z.object({ after: z.iso.datetime({ offset: true, error: 'Invalid date' }).optional() });
export type MessagesQuery = z.infer<typeof messagesQuery>;

/** Only the store and the distributor of the order may read or write its thread (others get 404). */
async function findOrder(user: AuthUser, id: string) {
  const scope = user.orgType === 'store' ? { storeId: user.orgId } : { distributorId: user.orgId };
  const order = await PurchaseOrder.findOne({ _id: id, ...scope });
  if (!order) throw notFoundError('Order');
  return order;
}

/** Chronological thread; `after` returns only newer messages (polling every 5 s, US-40). */
export async function list(user: AuthUser, id: string, { after }: MessagesQuery) {
  const order = await findOrder(user, id);
  const filter: Record<string, unknown> = { orderId: order._id };
  if (after) filter.createdAt = mongoose.trusted({ $gt: new Date(after) });
  const messages = await Message.find(filter).sort({ createdAt: 1, _id: 1 }).limit(500);
  return { data: messages.map(toMessageDto) };
}

export async function send(user: AuthUser, id: string, text: string) {
  const order = await findOrder(user, id);
  const message = await Message.create({
    orderId: order._id,
    senderId: user.id,
    senderName: user.name,
    senderOrgType: user.orgType,
    text,
  });
  // One notification per message for the other organization's order users.
  const toStore = user.orgType === 'distributor';
  await notify(
    toStore
      ? { orgId: order.storeId.toString(), roles: ['store_owner', 'store_inventory'] }
      : { orgId: order.distributorId.toString(), roles: ['distributor_owner', 'distributor_staff'] },
    {
      type: 'message',
      title: `New message on ${order.code} from ${toStore ? order.distributorName : order.storeName}`,
      body: text.length > 200 ? `${text.slice(0, 197)}…` : text,
      link: toStore ? `/app/orders/${order.id}` : `/dist/orders/${order.id}`,
    },
  );
  return toMessageDto(message);
}
