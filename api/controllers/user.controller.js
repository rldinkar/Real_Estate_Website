import User from "../models/User.js";
import Post from "../models/Post.js";
import SavedPost from "../models/SavedPost.js";
import Chat from "../models/Chat.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

// Get a single user
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};

// Update user profile
export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    let updateData = { ...inputs };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();
    const { password: userPassword, ...rest } = updatedUser;
    res.status(200).json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user!" });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};

// Save or Unsave a Post
export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    const existing = await SavedPost.findOne({ userId: tokenUserId, postId });

    if (existing) {
      await SavedPost.findByIdAndDelete(existing._id);
      res.status(200).json({ message: "Post removed from saved list" });
    } else {
      await SavedPost.create({ userId: tokenUserId, postId });
      res.status(200).json({ message: "Post saved" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save post!" });
  }
};

// Get posts created and saved by the user
export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await Post.find({ userId: tokenUserId });
    const savedRecords = await SavedPost.find({ userId: tokenUserId }).populate(
      "post"
    );

    const savedPosts = savedRecords.map((item) => item.post);
    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};

// Get unread chats count for notifications
export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const number = await Chat.countDocuments({
      userIDs: tokenUserId,
      seenBy: { $ne: tokenUserId },
    });

    res.status(200).json(number);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get notification number!" });
  }
};
