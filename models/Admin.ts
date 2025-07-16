import mongoose, { type Document, Schema } from "mongoose"

export interface IAdmin extends Document {
  _id: string
  email: string
  passwordHash: string
  role: "admin" | "super_admin"
  firstName: string
  lastName: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema)
