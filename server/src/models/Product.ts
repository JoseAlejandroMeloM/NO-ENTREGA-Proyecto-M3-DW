import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const CATEGORIES = [
  'groceries',
  'beverages',
  'dairy',
  'snacks',
  'cleaning',
  'personal_care',
  'bakery',
  'fruits_vegetables',
  'meat',
  'other',
] as const;
export const UNITS = ['unit', 'kg', 'g', 'l', 'ml', 'pack'] as const;

const productSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    sku: { type: String, required: true, trim: true, maxlength: 30 },
    category: { type: String, enum: CATEGORIES, required: true },
    unit: { type: String, enum: UNITS, required: true },
    price: { type: Number, required: true, min: 1 },
    cost: { type: Number, default: 0, min: 0 },
    // Only changed through the stock service (stock.ts), never by a plain update.
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    // "Notify once until restocked" (BR3): set when the low-stock alert is sent, cleared above minStock.
    lowStockNotified: { type: Boolean, default: false },
    // Same idea for the BR4 restock window (add-restock-alerts): set when the alert is sent, cleared on leaving it.
    restockNotified: { type: Boolean, default: false },
    active: { type: Boolean, default: true }, // soft delete keeps past sales readable
  },
  { timestamps: true },
);
// SKU is unique among the store's active products, so a deleted product's SKU can be reused.
productSchema.index({ storeId: 1, sku: 1 }, { unique: true, partialFilterExpression: { active: true } });
productSchema.index({ storeId: 1, active: 1, name: 1 });

export type ProductDoc = HydratedDocument<InferSchemaType<typeof productSchema>>;
export const Product = model('Product', productSchema);

/** Public shape (the `Product` schema in openapi.yaml). */
export function toProductDto(p: ProductDoc) {
  return {
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    category: p.category,
    unit: p.unit,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    minStock: p.minStock,
    lowStock: p.stock <= p.minStock,
    active: p.active,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
