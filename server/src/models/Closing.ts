import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const closingSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  date: { type: String, required: true },
  openingFloat: { type: Number, required: true },
  countedCash: { type: Number, required: true },
  expectedCash: { type: Number, required: true },
  cardTotal: { type: Number, required: true },
  nequiTotal: { type: Number, required: true },
  difference: { type: Number, required: true },
  note: { type: String, default: null },
});

closingSchema.index({ storeId: 1, date: -1 }, { unique: true });

export type ClosingDoc = HydratedDocument<InferSchemaType<typeof closingSchema>>;
export const Closing = model('Closing', closingSchema);
