import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { check, validationResult } from "express-validator";

// Register validation rules
const registerValidationRules = [
  check('username', 'Username is required and should be at least 3 characters')
    .isString()
    .isLength({ min: 3 }),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password should be at least 6 characters').isLength({ min: 6 }),
];

// Login validation rules
const loginValidationRules = [
  check('username', 'Username is required').isString(),
  check('password', 'Password is required').exists(),
];

// Error handler middleware to process validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const register = [
  // Validation rules for registration
  registerValidationRules,
  validate,
  async (req, res) => {
    const { username, email, password } = req.body;

    try {
      // HASH THE PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // CREATE A NEW USER AND SAVE TO DB
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      res.status(201).json({ message: "User created successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to create user!" });
    }
  }
];

export const login = [
  // Validation rules for login
  loginValidationRules,
  validate,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // CHECK IF THE USER EXISTS
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

      // CHECK IF THE PASSWORD IS CORRECT
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid)
        return res.status(400).json({ message: "Invalid Credentials!" });

      // GENERATE COOKIE TOKEN AND SEND TO THE USER
      const age = 1000 * 60 * 60 * 24 * 7;

      const token = jwt.sign(
        {
          id: user.id,
          isAdmin: false,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: age }
      );

      const { password: userPassword, ...userInfo } = user;

      res
        .cookie("token", token, {
          httpOnly: true,
          maxAge: age,
        })
        .status(200)
        .json(userInfo);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to login!" });
    }
  }
];

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};


