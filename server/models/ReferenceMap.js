
const mongoose = require("mongoose");

const referenceMapSchema = new mongoose.Schema(
    {
        district: {
            type: String,
            required: true,
            trim: true,
        },
        anchal: {
            type: String,
            required: true,
            trim: true,
        },
        halka: {
            type: String,
            required: true,
            trim: true,
        },
        mauza: {
            type: String,
            required: true,
            trim: true,
        },
        khasraNumber: {
            type: String,
            required: true,
            trim: true,
        },
        plotId: {
            type: String,
            trim: true,
            default: "",
        },
        originalFileName: {
            type: String,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
            enum: [
                "application/pdf",
                "image/png",
                "image/jpeg",
                "image/webp",
            ],
        },
        fileSize: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "ReferenceMap",
    referenceMapSchema
);
