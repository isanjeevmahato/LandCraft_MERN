
const express = require("express");
const crypto = require("crypto");
const GpsLocation = require("../models/GpsLocation");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Verify that the request comes from the authorized rover.
function verifyRoverKey(req, res, next) {
  const receivedKey = req.get("x-rover-key");
  const expectedKey = process.env.ROVER_API_KEY;

  if (!expectedKey || !receivedKey) {
    return res.status(401).json({
      success: false,
      message: "Rover authentication required.",
    });
  }

  const receivedBuffer = Buffer.from(receivedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid rover credentials.",
    });
  }

  next();
}

// Receive the latest GPS reading from the rover.
router.post("/location", verifyRoverKey, async (req, res) => {
  try {
    const { roverId, latitude, longitude, accuracy, satellites } = req.body;

    if (
      typeof roverId !== "string" ||
      !roverId.trim() ||
      roverId.trim().length > 50 ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid rover ID, latitude, or longitude.",
      });
    }

    if (
      accuracy !== undefined &&
      accuracy !== null &&
      (typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        accuracy < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GPS accuracy.",
      });
    }

    if (
      satellites !== undefined &&
      satellites !== null &&
      (!Number.isInteger(satellites) || satellites < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid satellite count.",
      });
    }

    const location = await GpsLocation.findOneAndUpdate(
      { roverId: roverId.trim() },
      {
        $set: {
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          satellites: satellites ?? null,
          receivedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "GPS location received.",
      location,
    });
  } catch (error) {
    console.error("GPS receive error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save GPS location.",
    });
  }
});

// Read the latest location from LandCraft's authenticated Admin panel.
router.get("/latest", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const location = await GpsLocation.findOne().sort({
      receivedAt: -1,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "No GPS readings received yet.",
      });
    }

    return res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    console.error("GPS read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve GPS location.",
    });
  }
});

module.exports = router;
