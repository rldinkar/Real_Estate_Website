import mongoose from "mongoose";
const { Schema } = mongoose;

const postSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  images: [String],
  address: String,
  city: String,
  bedroom: Number,
  bathroom: Number,
  latitude: String,
  longitude: String,
  type: { type: String, enum: ["buy", "rent"], required: true },
  property: {
    type: String,
    enum: ["apartment", "house", "condo", "land"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model("Post", postSchema);
