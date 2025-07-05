import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats, setChatData }) {
  const [chat, setChat] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [chatlist, setChatlist] = useState(chats); // local state copy
  const messageEndRef = useRef();
  const decrease = useNotificationStore((state) => state.decrease);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const updateChatAsRead = (chatId) => {
    setChatlist((prev) =>
      prev.map((item) =>
        item.id === chatId
          ? {
              ...item,
              seenBy: [...new Set([...item.seenBy, currentUser.id])],
            }
          : item
      )
    );
    if (setChatData) {
      setChatData((prev) =>
        prev.map((item) =>
          item.id === chatId
            ? {
                ...item,
                seenBy: [...new Set([...item.seenBy, currentUser.id])],
              }
            : item
        )
      );
    }
  };

  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest("/chats/" + id);
      if (!res.data.seenBy.includes(currentUser.id)) {
        decrease();
        await apiRequest.put("/chats/read/" + id);
        updateChatAsRead(id); // Mark chat as read in UI
      }
      setChat({ ...res.data, receiver });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get("text");

    if (!text) return;
    try {
      const res = await apiRequest.post("/messages/" + chat.id, { text });

      setChat((prev) => ({
        ...prev,
        messages: [...prev.messages, res.data],
      }));

      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: { ...res.data, chatId: chat.id },
      });

      // Update chatlist last message and mark as read
      setChatlist((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                lastMessage: res.data.text,
                seenBy: [...new Set([...c.seenBy, currentUser.id])],
              }
            : c
        )
      );

      e.target.reset();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (chatId) => {
    try {
      const response = await apiRequest.delete(`/chats/${chatId}`);
      if (response.status === 200) {
        alert("Chat deleted successfully!");
        setChatlist((prev) => prev.filter((chat) => chat.id !== chatId));
      } else {
        alert("Failed to delete the chat!");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("An error occurred while deleting the chat.");
    }
  };

  useEffect(() => {
    if (!socket || !chat) return;

    const read = async () => {
      try {
        await apiRequest.put("/chats/read/" + chat.id);
        updateChatAsRead(chat.id);
      } catch (err) {
        console.log(err);
      }
    };

    const handleIncoming = (data) => {
      if (chat.id === data.chatId) {
        setChat((prev) => ({
          ...prev,
          messages: [...prev.messages, data],
        }));
        read();
      }

      // Update chatlist with latest message
      setChatlist((prev) =>
        prev.map((c) =>
          c.id === data.chatId
            ? {
                ...c,
                lastMessage: data.text,
                seenBy: c.seenBy.includes(currentUser.id)
                  ? c.seenBy
                  : [...c.seenBy, currentUser.id],
              }
            : c
        )
      );
    };

    socket.on("getMessage", handleIncoming);
    return () => {
      socket.off("getMessage", handleIncoming);
    };
  }, [socket, chat]);

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {chatlist && chatlist.length > 0 ? (
          chatlist.map((c) => (
            <div
              className="message"
              key={c.id}
              style={{
                backgroundColor:
                  c.seenBy.includes(currentUser.id) || chat?.id === c.id
                    ? "white"
                    : "#fecd514e",
              }}
              onClick={() => handleOpenChat(c.id, c.receiver)}
            >
              <img src={c.receiver?.avatar || "/noavatar.jpg"} alt="no pic" />
              <span>{c.receiver?.username}</span>
              <p>{c.lastMessage}</p>
              <span
                className="del_span material-symbols-outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(c.id);
                }}
              >
                Delete
              </span>
            </div>
          ))
        ) : (
          <p>No chats available</p>
        )}
      </div>

      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver?.avatar || "/noavatar.jpg"} alt="" />
              {chat.receiver?.username}
            </div>
            <span className="close" onClick={() => setChat(null)}>
              X
            </span>
          </div>
          <div className="center">
            {chat.messages.map((message) => (
              <div
                className="chatMessage"
                key={message.id}
                style={{
                  alignSelf:
                    message.userId === currentUser.id
                      ? "flex-end"
                      : "flex-start",
                  textAlign:
                    message.userId === currentUser.id ? "right" : "left",
                }}
              >
                <p>{message.text}</p>
                <span>{format(message.createdAt)}</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          <form onSubmit={handleSubmit} className="bottom">
            <textarea name="text" required></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;
