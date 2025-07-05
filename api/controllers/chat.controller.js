import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  if (!tokenUserId) {
    return res.status(401).json({ message: "User not authenticated!" });
  }

  try {
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const chat of chats) {
      const receiverId = chat.userIDs.find((id) => id !== tokenUserId);
      
      // Check if receiverId is valid
      if (!receiverId) {
        chat.receiver = null; // Or handle this case as needed
        continue; // Skip to the next chat if there's no receiver
      }

      const receiver = await prisma.user.findUnique({
        where: {
          id: receiverId,
        },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      });
      chat.receiver = receiver;
    }

    res.status(200).json(chats);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      data: {
        seenBy: {
          push: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};


export const addChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const existingChat = await prisma.chat.findFirst({
      where: {
        userIDs: {
          hasEvery: [tokenUserId, req.body.receiverId],
        },
      },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, req.body.receiverId],
      },
    });

    res.status(200).json(newChat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};

export const deleteChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        messages: true, // Include messages to delete them
      },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found!" });
    }

    if (!chat.userIDs.includes(tokenUserId)) {
      return res.status(403).json({ message: "Unauthorized to delete this chat!" });
    }

    // First, delete all associated messages
    await prisma.message.deleteMany({
      where: {
        chatId: req.params.id,
      },
    });

    // Then, delete the chat
    await prisma.chat.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({ message: "Chat and associated messages deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete chat!" });
  }
};
