import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const NOTIFICATION_TYPES = ['low_stock', 'order_created', 'order_status', 'message', 'rating'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    orgId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: '', maxlength: 500 },
    // Client route of the related screen, e.g. /app/products/<id>.
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
// Serves the inbox (newest first), the unread count and read-all in one index.
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type NotificationDoc = HydratedDocument<InferSchemaType<typeof notificationSchema>>;
export const Notification = model('Notification', notificationSchema);

/** Public shape (the `Notification` schema in openapi.yaml). */
export function toNotificationDto(n: NotificationDoc) {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt,
  };
}
