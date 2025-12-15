const express = require("express");
const router = express.Router();
const { Application, Job, JobSeekerProfile, Wishlist, ActivityLog } = require("../models");
const { auth } = require("../middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         profileViews:
 *           type: number
 *         connections:
 *           type: number
 *         applications:
 *           type: number
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     CompanyDashboardStats:
 *       type: object
 *       properties:
 *         totalJobs:
 *           type: number
 *         activeJobs:
 *           type: number
 *         totalApplications:
 *           type: number
 *         recentApplications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Application'
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics for the logged-in user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/DashboardStats'
 *                 - $ref: '#/components/schemas/CompanyDashboardStats'
 */
router.get("/stats", auth, async (req, res) => {
  try {
    if (req.user.role === "seeker") {
      const profile = await JobSeekerProfile.findOne({ user: req.user._id });
      const applications = await Application.find({ applicant: req.user._id })
        .populate("job", "title")
        .sort({ createdAt: -1 })
        .limit(5);

      const applicationCount = await Application.countDocuments({ applicant: req.user._id });

      const recentActivity = applications.map((app) => ({
        type: "application",
        title: `Applied to ${app.job?.title || "Unknown Job"}`,
        status: app.status,
        timestamp: app.createdAt,
      }));

      res.json({
        profileViews: profile?.profileViews || 0,
        connections: 0, 
        applications: applicationCount,
        recentActivity,
      });
    } else {
      const jobs = await Job.find({ company: req.user._id });
      const jobIds = jobs.map((job) => job._id);

      const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
      const recentApplications = await Application.find({ job: { $in: jobIds } })
        .populate("job", "title")
        .populate("applicant", "name email")
        .sort({ createdAt: -1 })
        .limit(5);

      const activeJobs = jobs.filter((job) => job.status === "open").length;

      // Calculate analytics
      const totalViews = jobs.reduce((sum, job) => sum + (job.viewsCount || 0), 0);
      const totalWishlists = jobs.reduce((sum, job) => sum + (job.wishlistCount || 0), 0);
      const shortlistedCount = await Application.countDocuments({ 
        job: { $in: jobIds },
        status: "shortlisted"
      });

      // Get job-wise analytics
      const jobAnalytics = jobs.map((job) => ({
        jobId: job._id,
        title: job.title,
        views: job.viewsCount || 0,
        applications: job.applicationsCount || 0,
        wishlists: job.wishlistCount || 0,
        status: job.status,
      }));

      res.json({
        totalJobs: jobs.length,
        activeJobs,
        totalApplications,
        totalViews,
        totalWishlists,
        shortlistedCount,
        recentApplications,
        jobAnalytics,
      });
    }
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/dashboard/activity:
 *   get:
 *     summary: Get recent activity for the logged-in user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activity list
 */
router.get("/activity", auth, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    
    // Get activity logs from the ActivityLog collection
    const activityLogs = await ActivityLog.find({ user: req.user._id })
      .populate("relatedJob", "title")
      .sort({ createdAt: -1 })
      .limit(limit);

    const activities = activityLogs.map((log) => ({
      type: log.type,
      description: log.description,
      title: log.relatedJob?.title || "",
      timestamp: log.createdAt,
      metadata: log.metadata,
    }));

    // Fallback to old method if no activity logs found
    if (activities.length === 0) {
      if (req.user.role === "seeker") {
        const applications = await Application.find({ applicant: req.user._id })
          .populate("job", "title")
          .sort({ updatedAt: -1 })
          .limit(limit);

        applications.forEach((app) => {
          activities.push({
            type: "application",
            action: app.status === "pending" ? "submitted" : `updated to ${app.status}`,
            title: app.job?.title || "Unknown Job",
            timestamp: app.updatedAt,
          });
        });
      } else {
      const jobs = await Job.find({ company: req.user._id });
      const jobIds = jobs.map((job) => job._id);

      const applications = await Application.find({ job: { $in: jobIds } })
        .populate("job", "title")
        .populate("applicant", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

      applications.forEach((app) => {
        activities.push({
          type: "new_application",
          action: "received",
          title: `${app.applicant?.name || "Someone"} applied to ${app.job?.title || "Unknown Job"}`,
          timestamp: app.createdAt,
        });
      });

        const jobs = await Job.find({ company: req.user._id });
        jobs
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit)
          .forEach((job) => {
            activities.push({
              type: "job_created",
              action: "created",
              title: job.title,
              timestamp: job.createdAt,
            });
          });
      }

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    res.json(activities.slice(0, limit));
  } catch (error) {
    console.error("Get activity error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
