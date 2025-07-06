import mongoose from "mongoose";
const { Schema } = mongoose;

const savedPostSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ensure uniqueness of (userId, postId)
savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model("SavedPost", savedPostSchema);
