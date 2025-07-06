import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  chatIDs: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
});

export default mongoose.model("User", userSchema);
