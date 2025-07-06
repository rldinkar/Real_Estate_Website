import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Get all chats for the logged-in user
export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  if (!tokenUserId)
    return res.status(401).json({ message: "User not authenticated!" });

  try {
    let chats = await Chat.find({ userIDs: tokenUserId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach receiver info for frontend use
    for (let chat of chats) {
      const receiverId = chat.userIDs.find(
        (id) => id.toString() !== tokenUserId
      );
      if (!receiverId) {
        chat.receiver = null;
        continue;
      }

      const receiver = await User.findById(receiverId).select(
        "id username avatar"
      );
      chat.receiver = receiver;
    }

    res.status(200).json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

// Get a specific chat with messages
export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userIDs: tokenUserId,
    }).populate({
      path: "messages",
      options: { sort: { createdAt: 1 } },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found!" });
    }

    // Mark as seen by the current user
    if (!chat.seenBy.includes(tokenUserId)) {
      chat.seenBy.push(tokenUserId);
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

// Create or return existing chat between two users
export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const receiverId = req.body.receiverId;

  try {
    const existingChat = await Chat.findOne({
      userIDs: { $all: [tokenUserId, receiverId] },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = new Chat({
      userIDs: [tokenUserId, receiverId],
      seenBy: [tokenUserId],
    });

    await newChat.save();
    res.status(200).json(newChat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

// Mark chat as read by the user
export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userIDs: tokenUserId,
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    if (!chat.seenBy.includes(tokenUserId)) {
      chat.seenBy = [tokenUserId];
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};

// Delete chat and its messages
export const deleteChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    if (!chat.userIDs.includes(tokenUserId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this chat!" });
    }

    await Message.deleteMany({ chatId: chat._id });
    await Chat.findByIdAndDelete(chat._id);

    res
      .status(200)
      .json({ message: "Chat and associated messages deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete chat!" });
  }
};
