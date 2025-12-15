const express = require("express");
const router = express.Router();
const { User, JobSeekerProfile, CompanyProfile, Application, Wishlist, ActivityLog, Job } = require("../models");
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

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [seeker, company, admin]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden - admin only
 */
router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role and permissions (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [seeker, company, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 */
router.put("/users/:id/role", auth, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["seeker", "company", "admin"].includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot change your own role" });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot delete your own account" });
    }

    // Delete associated data comprehensively
    if (user.role === "seeker") {
      // Delete seeker profile
      await JobSeekerProfile.deleteOne({ user: user._id });
      // Delete applications
      await Application.deleteMany({ applicant: user._id });
      // Delete wishlist items
      await Wishlist.deleteMany({ user: user._id });
    } else if (user.role === "company") {
      // Delete company profile
      await CompanyProfile.deleteOne({ user: user._id });
      // Get all jobs posted by this company
      const companyJobs = await Job.find({ company: user._id });
      const jobIds = companyJobs.map(job => job._id);
      // Delete applications for these jobs
      await Application.deleteMany({ job: { $in: jobIds } });
      // Delete wishlists for these jobs
      await Wishlist.deleteMany({ job: { $in: jobIds } });
      // Delete the jobs
      await Job.deleteMany({ company: user._id });
    }
    
    // Delete activity logs
    await ActivityLog.deleteMany({ user: user._id });

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
