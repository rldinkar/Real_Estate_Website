import jwt from "jsonwebtoken";

export const shouldBeLoggedIn = async (req, res) => {
  // This assumes userId is already set via middleware
  if (!req.userId) {
    return res.status(401).json({ message: "Not authenticated!" });
  }

  res.status(200).json({ message: "You are Authenticated" });
};

export const shouldBeAdmin = async (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!payload.isAdmin) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    res.status(200).json({ message: "You are Admin Authenticated" });
  } catch (err) {
    return res.status(403).json({ message: "Token is not Valid!" });
  }
};
