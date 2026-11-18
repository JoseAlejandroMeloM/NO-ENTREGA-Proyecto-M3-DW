import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { dayRange, todayInBogota } from '../modules/sales/time';
import { CATEGORIES, UNITS } from './Product';

export const ORDER_STATUSES = ['pending', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const itemSchema = new Schema(
  {
    catalogItem: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    unit: { type: String, enum: UNITS, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, required: true },
    byName: { type: String, required: true }, // copied so the timeline needs no lookup
    note: { type: String, maxlength: 300 },
  },
  { _id: false },
);

const trackingNoteSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 200 },
    at: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, required: true },
    byName: { type: String, required: true }, // copied so the timeline needs no lookup
  },
  { _id: false },
);

const purchaseOrderSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    storeName: { type: String, required: true },
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true },
    distributorName: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [itemSchema], required: true },
    total: { type: Number, required: true },
    note: { type: String, maxlength: 300 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: { type: [historySchema], default: [] },
    estimatedDelivery: { type: Date, default: null }, // start of the Bogota day it is expected by
    trackingNotes: { type: [trackingNoteSchema], default: [] },
    rejectReason: { type: String, maxlength: 300 },
    receivedAt: { type: Date, default: null },
    rated: { type: Boolean, default: false },
  },
  { timestamps: true },
);
purchaseOrderSchema.index({ storeId: 1, createdAt: -1 });
purchaseOrderSchema.index({ distributorId: 1, status: 1, createdAt: -1 });

export type PurchaseOrderDoc = HydratedDocument<InferSchemaType<typeof purchaseOrderSchema>>;
export const PurchaseOrder = model('PurchaseOrder', purchaseOrderSchema);

/**
 * An order is delayed once the end of its estimated Bogota delivery day has passed while it is
 * still `accepted` or `shipped` (not yet delivered). Delivered, rejected and cancelled never delay.
 */
export function isDelayed(order: Pick<PurchaseOrderDoc, 'status' | 'estimatedDelivery'>, now = new Date()) {
  if (order.status !== 'accepted' && order.status !== 'shipped') return false;
  if (!order.estimatedDelivery) return false;
  return now >= dayRange(todayInBogota(order.estimatedDelivery)).end;
}

/** The `PurchaseOrder` schema in openapi.yaml. */
export function toOrderDto(o: PurchaseOrderDoc) {
  return {
    id: o.id as string,
    code: o.code,
    store: { id: o.storeId.toString(), name: o.storeName },
    distributor: { id: o.distributorId.toString(), name: o.distributorName },
    items: o.items.map((i) => ({
      catalogItem: i.catalogItem.toString(),
      name: i.name,
      unit: i.unit,
      category: i.category,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    total: o.total,
    note: o.note ?? null,
    status: o.status,
    statusHistory: o.statusHistory.map((h) => ({
      status: h.status,
      at: h.at,
      by: { id: h.by.toString(), name: h.byName },
      note: h.note ?? null,
    })),
    estimatedDelivery: o.estimatedDelivery ?? null,
    trackingNotes: o.trackingNotes.map((n) => ({
      text: n.text,
      at: n.at,
      by: { id: n.by.toString(), name: n.byName },
    })),
    delayed: isDelayed(o),
    rejectReason: o.rejectReason ?? null,
    receivedAt: o.receivedAt ?? null,
    rated: o.rated,
    createdAt: o.createdAt,
  };
}
