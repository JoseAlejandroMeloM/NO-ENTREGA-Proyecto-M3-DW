import { Schema, model, type InferSchemaType } from 'mongoose';

const distributorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    nit: { type: String, required: true, unique: true, match: /^\d{6,12}(-\d)?$/ },
    phone: { type: String, required: true, match: /^\d{7,15}$/ },
    coverageArea: { type: String, required: true, trim: true, maxlength: 120 },
    deliveryDays: { type: Number, required: true, min: 1, max: 30 },
    minimumOrder: { type: Number, required: true, min: 0 },
    categories: { type: [String], default: [] },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type DistributorDoc = InferSchemaType<typeof distributorSchema>;
export const Distributor = model('Distributor', distributorSchema);
