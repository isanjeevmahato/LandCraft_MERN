
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const LandRequest = require("../models/LandRequest");

const router = express.Router();

// Admin-only: view all submitted land requests
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await LandRequest.find()
      .select(
        "requestId userId requestType plotId location description parties status adminNotes surveyDate assignedFieldTeam assignedRover reportUrl createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching admin requests:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch land requests.",
    });
  }
});


/* Admin-only: update a land request's status */
router.patch(
  "/:requestId/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Submitted",
        "Under Review",
        "More Information Required",
        "Rejected",
        "Survey Scheduled",
        "Field Survey",
        "Verification",
        "Report Ready",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request status.",
        });
      }

      const request = await LandRequest.findOneAndUpdate(
        { requestId: req.params.requestId },
        { $set: { status } },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Land request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Request status updated successfully.",
        request: {
          requestId: request.requestId,
          status: request.status,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error) {
      console.error("Status update error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update request status.",
      });
    }
  }
);


/* Admin-only: schedule a field survey */
router.patch(
  "/:requestId/schedule",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { surveyDate, assignedFieldTeam, assignedRover } = req.body;

      if (
        typeof surveyDate !== "string" ||
        !surveyDate.trim() ||
        typeof assignedFieldTeam !== "string" ||
        !assignedFieldTeam.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Survey date and field team are required.",
        });
      }

      const parsedDate = new Date(surveyDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid survey date and time.",
        });
      }

      if (parsedDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Survey date and time must be in the future.",
        });
      }

      if (
        assignedRover !== undefined &&
        typeof assignedRover !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid rover assignment.",
        });
      }

      const request = await LandRequest.findOneAndUpdate(
        { requestId: req.params.requestId },
        {
          $set: {
            surveyDate: parsedDate,
            assignedFieldTeam: assignedFieldTeam.trim(),
            assignedRover: assignedRover?.trim() || "",
            status: "Survey Scheduled",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Land request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Field survey scheduled successfully.",
        request: {
          requestId: request.requestId,
          surveyDate: request.surveyDate,
          assignedFieldTeam: request.assignedFieldTeam,
          assignedRover: request.assignedRover,
          status: request.status,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error) {
      console.error("Survey scheduling error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to schedule the field survey.",
      });
    }
  }
);


/* Admin-only: save review notes and update request status */
router.patch(
  "/:requestId/review",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { adminNotes, status } = req.body;

      const allowedStatuses = [
        "Submitted",
        "Under Review",
        "More Information Required",
        "Rejected",
        "Survey Scheduled",
        "Field Survey",
        "Verification",
        "Report Ready",
      ];

      const hasNotes = adminNotes !== undefined;
      const hasStatus = status !== undefined;

      if (!hasNotes && !hasStatus) {
        return res.status(400).json({
          success: false,
          message: "Provide review notes or a request status.",
        });
      }

      if (hasNotes && typeof adminNotes !== "string") {
        return res.status(400).json({
          success: false,
          message: "Review notes must be text.",
        });
      }

      if (hasNotes && adminNotes.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Review notes cannot exceed 2000 characters.",
        });
      }

      if (hasStatus && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request status.",
        });
      }

      const updates = {};

      if (hasNotes) {
        updates.adminNotes = adminNotes.trim();
      }

      if (hasStatus) {
        updates.status = status;
      }

      const request = await LandRequest.findOneAndUpdate(
        { requestId: req.params.requestId },
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Land request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Request review saved successfully.",
        request: {
          requestId: request.requestId,
          adminNotes: request.adminNotes,
          status: request.status,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error) {
      console.error("Request review error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to save request review.",
      });
    }
  }
);


module.exports = router;
