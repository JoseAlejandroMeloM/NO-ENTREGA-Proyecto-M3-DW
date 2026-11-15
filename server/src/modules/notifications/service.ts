import mongoose from 'mongoose';
import type { AuthUser } from '../../middleware/auth';
import { Notification, toNotificationDto, type NotificationType } from '../../models/Notification';
import type { Role } from '../../models/roles';
import { User } from '../../models/User';
import { notFoundError } from '../../utils/errors';
import type { ListNotificationsQuery } from './schemas';

/** Who receives an event: explicit users, or every user with some roles in one organization. */
export type NotifyTarget = { userIds: string[] } | { orgId: string; roles: Role[] };

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Internal API for other modules (inventory, orders, messages). Creates one unread notification
 * per active recipient and returns how many were created. Not exposed over HTTP.
 */
export async function notify(target: NotifyTarget, input: NotifyInput): Promise<number> {
  // sanitizeFilter is on, so server-built operators must be marked as trusted.
  const filter =
    'userIds' in target
      ? { _id: mongoose.trusted({ $in: target.userIds }), active: true }
      : { orgId: target.orgId, role: mongoose.trusted({ $in: target.roles }), active: true };
  const recipients = await User.find(filter).select('_id orgId');
  if (recipients.length === 0) return 0;
  await Notification.insertMany(recipients.map((u) => ({ ...input, userId: u._id, orgId: u.orgId })));
  return recipients.length;
}

export async function listMine(user: AuthUser, { page, limit, unread, type }: ListNotificationsQuery) {
  const filter = { userId: user.id, ...(unread === undefined ? {} : { read: !unread }), ...(type ? { type } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: user.id, read: false }),
  ]);
  return { page, limit, total, unreadCount, data: items.map(toNotificationDto) };
}

/** Filtering by userId means other users' notifications look like they do not exist (404). */
export async function markRead(user: AuthUser, id: string) {
  const res = await Notification.updateOne({ _id: id, userId: user.id }, { read: true });
  if (res.matchedCount === 0) throw notFoundError('Notification');
}

export async function markAllRead(user: AuthUser) {
  await Notification.updateMany({ userId: user.id, read: false }, { read: true });
}
