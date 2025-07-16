import mongoose, { type Document, Schema } from "mongoose";

export interface IFamilyTree extends Document {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  shareLink: string;
  exportPdfUrl?: string;
  exportImageUrl?: string;
  nodePositions?: Array<{
    memberId: string;
    x: number;
    y: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyTreeSchema = new Schema<IFamilyTree>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareLink: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    exportPdfUrl: {
      type: String,
    },
    exportImageUrl: {
      type: String,
    },
    nodePositions: [
      {
        memberId: {
          type: String,
        },
        x: {
          type: Number,
        },
        y: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.FamilyTree ||
  mongoose.model<IFamilyTree>("FamilyTree", FamilyTreeSchema);
