import { Schema, model, type InferSchemaType } from 'mongoose';
import { CATEGORIES, UNITS } from './Product';

const catalogItemSchema = new Schema(
  {
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    category: { type: String, enum: CATEGORIES, required: true },
    unit: { type: String, enum: UNITS, required: true },
    price: { type: Number, required: true, min: 1 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);
catalogItemSchema.index({ distributorId: 1, category: 1, name: 1 });

export type CatalogItemDoc = InferSchemaType<typeof catalogItemSchema>;
export const CatalogItem = model('CatalogItem', catalogItemSchema);

/** The `CatalogItem` schema in openapi.yaml. */
export function toCatalogItemDto(i: InstanceType<typeof CatalogItem>) {
  return {
    id: i._id.toString(),
    distributor: i.distributorId.toString(),
    name: i.name,
    category: i.category,
    unit: i.unit,
    price: i.price,
    available: i.available,
  };
}
