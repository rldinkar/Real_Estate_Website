// middleware/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = payload.id;
    req.isAdmin = payload.isAdmin;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
