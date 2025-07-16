import mongoose, { Document, Schema } from "mongoose";

export interface IMember extends Document {
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "other";
  birthDate?: Date;
  deathDate?: Date;
  bio?: string;
  profileImageUrl?: string;
  familyTreeId: string;
  parents: mongoose.Types.ObjectId[];
  children: mongoose.Types.ObjectId[];
  spouseId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    birthDate: { type: Date },
    deathDate: { type: Date },
    bio: { type: String },
    profileImageUrl: { type: String },
    familyTreeId: { type: String, required: true },
    parents: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    children: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    spouseId: { type: Schema.Types.ObjectId, ref: "Member", required: false },
  },
  { timestamps: true }
);

// Create indexes for better query performance
MemberSchema.index({ familyTreeId: 1 });
MemberSchema.index({ parents: 1 });
MemberSchema.index({ children: 1 });
MemberSchema.index({ spouseId: 1 });

export default mongoose.models.Member ||
  mongoose.model<IMember>("Member", MemberSchema);
