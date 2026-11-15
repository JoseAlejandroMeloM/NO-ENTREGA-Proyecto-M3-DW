import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ORG_TYPES, ROLES } from './roles';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never returned unless a query explicitly asks for it with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    orgType: { type: String, enum: ORG_TYPES, required: true },
    orgId: { type: Schema.Types.ObjectId, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
userSchema.index({ orgId: 1, role: 1 });

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);

/** Public shape of a user (the `User` schema in openapi.yaml). */
export function toUserDto(u: UserDoc) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    orgType: u.orgType,
    orgId: u.orgId.toString(),
    active: u.active,
    createdAt: u.createdAt,
  };
}
