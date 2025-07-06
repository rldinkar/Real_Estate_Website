import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import User from "../models/User.js";

// Register validation rules
const registerValidationRules = [
  check("username", "Username is required and should be at least 3 characters")
    .isString()
    .isLength({ min: 3 }),
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password should be at least 6 characters").isLength({
    min: 6,
  }),
];

// Login validation rules
const loginValidationRules = [
  check("username", "Username is required").isString(),
  check("password", "Password is required").exists(),
];

// Error handler middleware to process validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// REGISTER
export const register = [
  registerValidationRules,
  validate,
  async (req, res) => {
    const { username, email, password } = req.body;

    try {
      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Username or email already taken." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save();
      res.status(201).json({ message: "User created successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create user!" });
    }
  },
];

// LOGIN
export const login = [
  loginValidationRules,
  validate,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });

      if (!user)
        return res.status(400).json({ message: "Invalid Credentials!" });

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid)
        return res.status(400).json({ message: "Invalid Credentials!" });

      const age = 1000 * 60 * 60 * 24 * 7; // 7 days

      const token = jwt.sign(
        {
          id: user._id,
          isAdmin: false,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: age }
      );

      const { password: _, ...userInfo } = user._doc;

      res
        .cookie("token", token, {
          httpOnly: true,
          maxAge: age,
        })
        .status(200)
        .json(userInfo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to login!" });
    }
  },
];

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
