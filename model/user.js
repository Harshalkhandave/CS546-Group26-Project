import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    lowerEmail: { type: String, required: true, trim: true },
    hashedPwd: { type: String, required: true },
    role: { type: String, default: "user" },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    likedBoroughs: [{ type: Schema.Types.ObjectId, ref: "Borough" }]
  },
  { timestamps: { createdAt: "creationDate", updatedAt: "updatedAt" } }
);

userSchema.index({ lowerEmail: 1 }, { unique: true });

const userCollection = model("user", userSchema)
export default userCollection;
