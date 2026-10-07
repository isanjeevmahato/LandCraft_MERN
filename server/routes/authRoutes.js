const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    // Check required fields
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check whether email or mobile already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or mobile number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check required fields
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/mobile and password are required",
      });
    }

    const loginIdentifier = identifier.trim();

    // Find user by email or mobile
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { mobile: loginIdentifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile or password",
      });
    }

    // Compare entered password with stored hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

module.exports = router;