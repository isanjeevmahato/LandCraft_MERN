const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LandCraft server is running",
  });
});


// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });


// Start server
app.listen(PORT, () => {
  console.log(`LandCraft server running on http://localhost:${PORT}`);
});