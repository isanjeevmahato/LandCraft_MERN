const express = require("express");
const LandRequest = require("../models/LandRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Submit a land request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      requestType,
      plotId,
      location,
      description,
      parties,
    } = req.body;

    // Validate required information
    if (!requestType || !location?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request type, location, and description are required.",
      });
    }

    // A request must identify at least one involved party.
    if (
      !Array.isArray(parties) ||
      parties.length === 0 ||
      parties.some((party) => !party.name?.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Add at least one party with a name.",
      });
    }

    // Generate a unique-looking demo request ID.
    const requestId = `REQ-${Date.now()}`;

    // Save the request under the authenticated user's ID.
    const landRequest = await LandRequest.create({
      requestId,
      userId: req.user.userId,
      requestType,
      plotId: plotId?.trim() || "",
      location: location.trim(),
      description: description.trim(),
      parties: parties.map((party) => ({
        name: party.name.trim(),
        mobile: party.mobile?.trim() || "",
        claimDescription: party.claimDescription?.trim() || "",
      })),
    });

    return res.status(201).json({
      success: true,
      message: "Land request submitted successfully.",
      request: {
        requestId: landRequest.requestId,
        requestType: landRequest.requestType,
        plotId: landRequest.plotId,
        location: landRequest.location,
        description: landRequest.description,
        parties: landRequest.parties,
        status: landRequest.status,
        createdAt: landRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Land request submission error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Some request information is invalid.",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Request ID conflict. Please submit again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit the land request right now.",
    });
  }
});

// Get requests submitted by the logged-in user
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const requests = await LandRequest.find({
      userId: req.user.userId,
    })
      .select(
        "requestId requestType plotId location status createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Fetch user requests error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve your requests right now.",
    });
  }
});

module.exports = router;