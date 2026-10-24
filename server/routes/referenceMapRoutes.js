
const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");

const ReferenceMap = require("../models/ReferenceMap");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Configure Cloudinary using server/.env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Receive files in memory instead of saving them locally.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only PDF, PNG, JPG, and WEBP files are allowed.")
      );
    }

    callback(null, true);
  },
});

function uploadToCloudinary(buffer, resourceType, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: publicId,
        overwrite: false,
        folder: "landcraft/reference-maps",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("referenceFile"),
  async (req, res) => {
    let uploadedFile = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a reference PDF or image.",
        });
      }

      const {
        district,
        anchal,
        halka,
        mauza,
        khasraNumber,
        plotId,
      } = req.body;

      if (
        !district?.trim() ||
        !anchal?.trim() ||
        !halka?.trim() ||
        !mauza?.trim() ||
        !khasraNumber?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required plot details.",
        });
      }

      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary is not configured on the server.",
        });
      }

      const isPdf = req.file.mimetype === "application/pdf";
      const resourceType = isPdf ? "raw" : "image";

      const publicId =
        `reference-${crypto.randomUUID()}${isPdf ? ".pdf" : ""}`;

      uploadedFile = await uploadToCloudinary(
        req.file.buffer,
        resourceType,
        publicId
      );

      const referenceMap = await ReferenceMap.create({
        district: district.trim(),
        anchal: anchal.trim(),
        halka: halka.trim(),
        mauza: mauza.trim(),
        khasraNumber: khasraNumber.trim(),
        plotId: plotId?.trim() || "",
        originalFileName: path.basename(req.file.originalname),
        cloudinaryPublicId: uploadedFile.public_id,
        fileUrl: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });

      return res.status(201).json({
        success: true,
        message: "Reference map uploaded successfully.",
        referenceMap,
      });
    } catch (error) {
      // If MongoDB saving fails, try to remove the uploaded Cloudinary file.
      if (uploadedFile?.public_id) {
        try {
          await cloudinary.uploader.destroy(
            uploadedFile.public_id,
            {
              resource_type:
                uploadedFile.resource_type || "image",
            }
          );
        } catch (cleanupError) {
          console.error("Cloudinary cleanup failed:", cleanupError.message);
        }
      }

      console.error("Reference map upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to save the reference map.",
      });
    }
  }
);

module.exports = router;
