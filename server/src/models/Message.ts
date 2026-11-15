import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true }, // copied so the thread needs no lookup
    senderOrgType: { type: String, enum: ['store', 'distributor'], required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 }, // plain text, never HTML
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
messageSchema.index({ orderId: 1, createdAt: 1 });

export type MessageDoc = HydratedDocument<InferSchemaType<typeof messageSchema>>;
export const Message = model('Message', messageSchema);

/** The `Message` schema in openapi.yaml. */
export function toMessageDto(m: MessageDoc) {
  return {
    id: m.id as string,
    order: m.orderId.toString(),
    sender: { id: m.senderId.toString(), name: m.senderName, orgType: m.senderOrgType },
    text: m.text,
    createdAt: m.createdAt,
  };
}
