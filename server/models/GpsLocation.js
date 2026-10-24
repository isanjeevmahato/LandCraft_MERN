const mongoose = require("mongoose");

const gpsLocationSchema = new mongoose.Schema(
  {
    roverId: {
      type: String,
      required: true,
      trim: true,
      default: "rover-01",
      maxlength: 50,
    },

    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    accuracy: {
      type: Number,
      default: null,
      min: 0,
    },

    satellites: {
      type: Number,
      default: null,
      min: 0,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

gpsLocationSchema.index({ roverId: 1 }, { unique: true });

module.exports = mongoose.model("GpsLocation", gpsLocationSchema);
