import { Schema, model } from 'mongoose';

const ratingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, unique: true },
    storeId: { type: Schema.Types.ObjectId, required: true },
    distributorId: { type: Schema.Types.ObjectId, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 300 },
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
ratingSchema.index({ distributorId: 1, createdAt: -1 });

export const Rating = model('Rating', ratingSchema);
