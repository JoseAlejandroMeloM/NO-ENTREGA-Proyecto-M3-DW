import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const PAYMENT_METHODS = ['card', 'nequi', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Name and price are copied at sale time, so later product edits or deletion never change a past sale.
const saleItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [saleItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    amountReceived: { type: Number, min: 0 }, // cash only
    change: { type: Number, min: 0 }, // cash only
    // Voiding (add-sale-voiding): the sale stays in the history, marked, and leaves totals and insights.
    voidedAt: { type: Date, default: null },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
saleSchema.index({ storeId: 1, createdAt: -1 });
saleSchema.index({ storeId: 1, paymentMethod: 1, createdAt: -1 });
saleSchema.index({ storeId: 1, cashierId: 1, createdAt: -1 });
saleSchema.index({ 'items.productId': 1 });

export type SaleDoc = HydratedDocument<InferSchemaType<typeof saleSchema>>;
export const Sale = model('Sale', saleSchema);
