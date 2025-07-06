import mongoose from "mongoose";
const { Schema } = mongoose;

const postDetailSchema = new Schema({
  desc: { type: String, required: true },
  utilities: String,
  pet: String,
  income: String,
  size: Number,
  school: Number,
  bus: Number,
  restaurant: Number,
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    unique: true,
    required: true,
  },
});

export default mongoose.model("PostDetail", postDetailSchema);
