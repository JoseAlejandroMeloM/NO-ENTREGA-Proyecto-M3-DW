import { Schema, model, type InferSchemaType } from 'mongoose';

const storeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 160 },
    phone: { type: String, required: true, match: /^\d{7,15}$/ },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type StoreDoc = InferSchemaType<typeof storeSchema>;
export const Store = model('Store', storeSchema);

/** Public shape (the `Store` schema in openapi.yaml). */
export function toStoreDto(s: InstanceType<typeof Store>) {
  return { id: s._id.toString(), name: s.name, address: s.address, phone: s.phone };
}
