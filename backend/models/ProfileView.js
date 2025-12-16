const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewerRole: {
      type: String,
      enum: ["seeker", "company", "admin"],
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate views from same user on the same day
profileViewSchema.index({ profile: 1, viewer: 1, viewedAt: 1 });

// Index for efficient querying
profileViewSchema.index({ profile: 1, viewedAt: -1 });

module.exports = mongoose.model("ProfileView", profileViewSchema);
