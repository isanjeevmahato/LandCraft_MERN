const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const landRequestRoutes = require("./routes/landRequestRoutes");
const adminRequestRoutes = require("./routes/adminRequestRoutes");
const gpsRoutes = require("./routes/gpsRoutes");
const referenceMapRoutes = require("./routes/referenceMapRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
console.log("MONGO_URI exists:", Boolean(MONGO_URI));
console.log("MONGO_URI starts with mongodb:", MONGO_URI?.startsWith("mongodb"));

// Middleware
app.use(cors());
app.use(express.json());

// Ensure API requests wait for MongoDB to be available.
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Database temporarily unavailable. Please try again.",
    });
  }
});


app.use("/api/auth", authRoutes);
app.use("/api/requests", landRequestRoutes);
app.use("/api/admin/requests", adminRequestRoutes);
app.use("/api/gps", gpsRoutes);
app.use("/api/reference-maps", referenceMapRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LandCraft server is running",
  });
});


// Connect to MongoDB

let mongoConnectionPromise = null;

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  // Reuse an existing healthy connection.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Reuse an in-progress connection attempt.
  if (mongoConnectionPromise) {
    return mongoConnectionPromise;
  }

  mongoConnectionPromise = mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log("MongoDB connected successfully");
      return mongoose.connection;
    })
    .catch((error) => {
      // Allow a later request to retry the connection.
      mongoConnectionPromise = null;
      console.error("MongoDB connection failed:", error.message);
      throw error;
    });

  return mongoConnectionPromise;
}

// Start server locally; Vercel uses the exported Express app
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LandCraft server running on http://localhost:${PORT}`);
  });
}

module.exports = app;