import Post from "../models/Post.js";
import PostDetail from "../models/PostDetail.js";
import SavedPost from "../models/SavedPost.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const getPost = async (req, res) => {
  const id = req.params.id;

  try {
    const post = await Post.findById(id)
      .populate("postDetail")
      .populate("userId", "username avatar")
      .lean();

    if (!post) return res.status(404).json({ message: "Post not found" });

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) return res.status(200).json({ ...post, isSaved: false });

        const saved = await SavedPost.findOne({
          userId: payload.id,
          postId: id,
        });

        res.status(200).json({ ...post, isSaved: !!saved });
      });
    } else {
      res.status(200).json({ ...post, isSaved: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const { postData, postDetail } = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = new Post({
      ...postData,
      userId: tokenUserId,
    });

    await newPost.save();

    const newDetail = new PostDetail({
      ...postDetail,
      postId: newPost._id,
    });

    await newDetail.save();

    res.status(200).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};
export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await Post.findById(id);

    if (!post || post.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    const updatedPost = await Post.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post" });
  }
};
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await Post.findById(id);

    if (!post || post.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    await PostDetail.deleteMany({ postId: id });
    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const filter = {
      ...(query.city && { city: query.city }),
      ...(query.type && { type: query.type }),
      ...(query.property && { property: query.property }),
      ...(query.bedroom && { bedroom: parseInt(query.bedroom) }),
      ...(query.minPrice || query.maxPrice
        ? {
            price: {
              ...(query.minPrice && { $gte: parseInt(query.minPrice) }),
              ...(query.maxPrice && { $lte: parseInt(query.maxPrice) }),
            },
          }
        : {}),
    };

    const posts = await Post.find(filter);
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};
