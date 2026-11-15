import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const MOVEMENT_TYPES = ['adjustment', 'sale', 'order_received', 'void'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];
export const ADJUSTMENT_REASONS = ['count', 'damage', 'other'] as const;

const stockMovementSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true }, // signed: negative = out
    stockAfter: { type: Number, required: true },
    reason: { type: String, enum: ADJUSTMENT_REASONS },
    note: { type: String, maxlength: 200 },
    reference: { type: Schema.Types.ObjectId }, // sale or order id
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
stockMovementSchema.index({ productId: 1, createdAt: -1 });

export type StockMovementDoc = HydratedDocument<InferSchemaType<typeof stockMovementSchema>>;
export const StockMovement = model('StockMovement', stockMovementSchema);
