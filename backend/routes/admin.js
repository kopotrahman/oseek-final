const express = require("express");
const router = express.Router();
const { User, JobSeekerProfile, CompanyProfile } = require("../models");
const { auth, authorize } = require("../middleware");

/**
 * @swagger
 * /api/admin/seekers:
 *   get:
 *     summary: Get all job seekers (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of job seekers
 *       403:
 *         description: Forbidden - admin only
 */
router.get("/seekers", auth, authorize("admin"), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const seekers = await JobSeekerProfile.find(query)
      .populate("user", "name email role createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: seekers.length,
      seekers,
    });
  } catch (error) {
    console.error("Get seekers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/companies:
 *   get:
 *     summary: Get all companies (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or email
 *     responses:
 *       200:
 *         description: List of companies
 *       403:
 *         description: Forbidden - admin only
 */
router.get("/companies", auth, authorize("admin"), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { companyName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const companies = await CompanyProfile.find(query)
      .populate("user", "name email role createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/seekers/{id}:
 *   delete:
 *     summary: Delete a job seeker profile (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job seeker profile ID
 *     responses:
 *       200:
 *         description: Job seeker deleted successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Job seeker not found
 */
router.delete("/seekers/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const seeker = await JobSeekerProfile.findById(req.params.id);
    
    if (!seeker) {
      return res.status(404).json({ message: "Job seeker not found" });
    }

    // Delete the profile first, then the user account
    // If user deletion fails, at least the profile is removed
    const userId = seeker.user;
    await JobSeekerProfile.findByIdAndDelete(req.params.id);
    
    try {
      await User.findByIdAndDelete(userId);
    } catch (userDeleteError) {
      console.error("Error deleting user account:", userDeleteError);
      // Continue even if user deletion fails
    }

    res.json({
      success: true,
      message: "Job seeker profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete seeker error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/companies/{id}:
 *   delete:
 *     summary: Delete a company profile (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company profile ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Company not found
 */
router.delete("/companies/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const company = await CompanyProfile.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Delete the profile first, then the user account
    // If user deletion fails, at least the profile is removed
    const userId = company.user;
    await CompanyProfile.findByIdAndDelete(req.params.id);
    
    try {
      await User.findByIdAndDelete(userId);
    } catch (userDeleteError) {
      console.error("Error deleting user account:", userDeleteError);
      // Continue even if user deletion fails
    }

    res.json({
      success: true,
      message: "Company profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
