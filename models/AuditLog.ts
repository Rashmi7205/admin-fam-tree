import mongoose, { type Document, Schema } from "mongoose"

export interface IAuditLog extends Document {
  _id: string
  userId: string
  action: string
  targetType: string
  targetId: string
  timestamp: Date
  details?: any
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
  },
)

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
