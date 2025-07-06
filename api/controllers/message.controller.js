import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;

  try {
    const chat = await Chat.findOne({
      _id: chatId,
      userIDs: tokenUserId, // user is part of this chat
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    // Create message
    const message = new Message({
      text,
      chatId,
      userId: tokenUserId,
    });

    await message.save();

    // Update chat with last message and seenBy
    chat.lastMessage = text;
    chat.seenBy = [tokenUserId]; // Reset seenBy to just sender
    await chat.save();

    res.status(200).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};
