import mongoose from "mongoose";
const { Schema } = mongoose;

const chatSchema = new Schema({
  userIDs: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  seenBy: [{ type: Schema.Types.ObjectId }],
  lastMessage: String,
});

export default mongoose.model("Chat", chatSchema);
