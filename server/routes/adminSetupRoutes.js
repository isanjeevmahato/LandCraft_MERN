
const express = require("express");
const { timingSafeEqual } = require("crypto");
const User = require("../models/User");

const router = express.Router();

// One-time initial Admin setup
router.post("/", async (req, res) => {
  try {
    const configuredKey = process.env.ADMIN_SETUP_KEY;
    const providedKey = req.body?.setupKey;
    const email = req.body?.email;

    if (!configuredKey) {
      return res.status(500).json({
        success: false,
        message: "Admin setup is not configured on the server.",
      });
    }

    // Verify the private setup key.
    if (typeof providedKey !== "string") {
      return res.status(403).json({
        success: false,
        message: "Invalid Admin setup key.",
      });
    }

    const expected = Buffer.from(configuredKey);
    const supplied = Buffer.from(providedKey);

    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid Admin setup key.",
      });
    }

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Enter the email used to register your account.",
      });
    }

    // Do not allow initial setup if an Admin already exists.
    const existingAdmin = await User.exists({ role: "admin" });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Initial Admin setup has already been completed.",
      });
    }

    // Find the existing registered account, ignoring email case.
    const safeEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const user = await User.findOne({
      email: { $regex: `^${safeEmail}$`, $options: "i" },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account was found with that email.",
      });
    }

    // Promote only the selected existing account.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        role: { $ne: "admin" },
      },
      {
        $set: { role: "admin" },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("_id name email role");

    if (!updatedUser) {
      return res.status(409).json({
        success: false,
        message: "This account could not be authorized. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Initial Admin account created successfully.",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete Admin setup.",
    });
  }
});

module.exports = router;
