import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
  text: { type: String, required: true },
  userId: { type: String, required: true },
  chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
