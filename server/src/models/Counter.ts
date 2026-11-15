import { Schema, model } from 'mongoose';

/** Atomic sequences (e.g. purchase order codes). */
const counterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } });
export const Counter = model('Counter', counterSchema);

export async function nextSeq(name: string): Promise<number> {
  const c = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}
