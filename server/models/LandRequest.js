const mongoose = require("mongoose");

const landRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // The user who submitted this request
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Details of the reported issue
    requestType: {
      type: String,
      enum: [
        "Boundary Dispute",
        "Land Verification",
        "Boundary Mismatch",
        "Encroachment Report",
        "Other",
      ],
      required: true,
    },

    plotId: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Supports any number of involved parties
    parties: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        mobile: {
          type: String,
          trim: true,
          default: "",
        },

        claimDescription: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    // Document references can be added when file storage is implemented
    documents: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],

    // Admin updates this as the case progresses
    status: {
      type: String,
      enum: [
        "Submitted",
        "Under Review",
        "More Information Required",
        "Rejected",
        "Survey Scheduled",
        "Field Survey",
        "Verification",
        "Report Ready",
      ],
      default: "Submitted",
    },

    adminNotes: {
      type: String,
      default: "",
    },

    surveyDate: {
      type: Date,
      default: null,
    },

    assignedFieldTeam: {
      type: String,
      default: "",
    },

    assignedRover: {
      type: String,
      default: "",
    },

    reportUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LandRequest",
  landRequestSchema
);