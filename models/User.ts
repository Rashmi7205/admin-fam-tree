import { type Document, Schema, model, models } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: "google" | "facebook" | "email";
  uid: string;
  passwordHash?: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  profileComplete: boolean;
  phoneNumber?: string;
  phoneNumberTemp?: string;
  profile?: {
    title?: string;
    fullName?: string;
    gender?: string;
    dateOfBirth?: Date;
    bloodGroup?: string;
    education?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  address?: {
    street?: string;
    city: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  otp?: string;
  otpExpiry?: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    photoURL: { type: String },
    provider: {
      type: String,
      enum: ["google", "facebook", "email"],
      required: true,
    },
    uid: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false },
    onboardingComplete: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    phoneNumber: { type: String },
    phoneNumberTemp: { type: String },
    profile: {
      title: { type: String },
      fullName: { type: String },
      gender: { type: String },
      dateOfBirth: { type: Date },
      bloodGroup: { type: String },
      education: { type: String },
      occupation: { type: String },
      maritalStatus: { type: String },
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    otp: { type: String },
    otpExpiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default models.User || model<IUser>("User", UserSchema);
