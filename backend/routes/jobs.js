const express = require("express");
const router = express.Router();
const { Job, Application, CompanyProfile, Wishlist, User } = require("../models");
const { auth, authorize } = require("../middleware");
const { sendWishlistNotification } = require("../utils/emailService");


const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         company:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         type:
 *           type: string
 *           enum: [full-time, part-time, contract, remote, internship]
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: string
 *         status:
 *           type: string
 *           enum: [open, closed, paused]
 *         applicationsCount:
 *           type: number
 *         openings:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *     JobCreateRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         type:
 *           type: string
 *           enum: [full-time, part-time, contract, remote, internship]
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: string
 *         openings:
 *           type: number
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with optional filtering
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title, description, or location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full-time, part-time, contract, remote, internship]
 *         description: Job type filter
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pages:
 *                       type: number
 */
router.get("/", async (req, res) => {
  try {
    const { q, type, location } = req.query;
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const query = { status: "open" };

    
    if (q) {
      const escapedQ = escapeRegex(q);
      query.$or = [
        { title: { $regex: escapedQ, $options: "i" } },
        { description: { $regex: escapedQ, $options: "i" } },
        { location: { $regex: escapedQ, $options: "i" } },
      ];
    }

    
    if (type) {
      query.type = type;
    }


    if (location) {
      const escapedLocation = escapeRegex(location);
      query.location = { $regex: escapedLocation, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const total = await Job.countDocuments(query);

   
    const jobsWithCompanyInfo = await Job.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "companyprofiles",
          localField: "company",
          foreignField: "user",
          as: "companyProfile"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "company",
          foreignField: "_id",
          as: "companyUser"
        }
      }
    ]);

    
    const jobsWithCompanyInfoMapped = jobsWithCompanyInfo.map(job => {
      const companyProfile = job.companyProfile && job.companyProfile[0];
      const companyUser = job.companyUser && job.companyUser[0];
      const { companyProfile: _, companyUser: __, ...jobData } = job;
      return {
        ...jobData,
        companyName: companyProfile?.companyName || companyUser?.name || "",
        companyLogo: companyProfile?.logo || "",
      };
    });

    res.json({
      jobs: jobsWithCompanyInfoMapped,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/jobs/company/my-jobs:
 *   get:
 *     summary: Get all jobs posted by the logged-in company
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company's jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 */
router.get("/company/my-jobs", auth, authorize("company"), async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("Get company jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a specific job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 */
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("company", "name");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Increment view count (feature 4)
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    const companyProfile = await CompanyProfile.findOne({ user: job.company._id });

    res.json({
      ...job.toObject(),
      companyName: companyProfile?.companyName || job.company.name,
      companyLogo: companyProfile?.logo || "",
      companyDescription: companyProfile?.description || "",
    });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCreateRequest'
 *     responses:
 *       201:
 *         description: Job created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       403:
 *         description: Only companies can post jobs
 */
router.post("/", auth, authorize("company"), async (req, res) => {
  try {
    const { title, description, location, type, salary, skills, experience, openings } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ message: "Title, description, and location are required" });
    }

    const job = new Job({
      company: req.user._id,
      title,
      description,
      location,
      type: type || "full-time",
      salary,
      skills: skills || [],
      experience: experience || "0-1 years",
      openings: openings && openings > 0 ? openings : 1,
    });

    await job.save();

    // Send notifications to users who have similar jobs in wishlist (feature 5)
    // Find users who might be interested based on title or skills
    try {
      const similarJobs = await Job.find({
        $or: [
          { title: { $regex: title.split(" ")[0], $options: "i" } },
          { skills: { $in: skills || [] } },
        ],
        _id: { $ne: job._id },
      }).limit(10);

      const similarJobIds = similarJobs.map((j) => j._id);
      
      const wishlists = await Wishlist.find({
        job: { $in: similarJobIds },
        notified: false,
      }).populate("user");

      // Send notifications to interested users
      for (const wishlist of wishlists) {
        if (wishlist.user && wishlist.user.email) {
          await sendWishlistNotification(
            wishlist.user.email,
            job.title,
            job._id
          );
          wishlist.notified = true;
          await wishlist.save();
        }
      }
    } catch (notificationError) {
      console.error("Error sending wishlist notifications:", notificationError);
      // Don't fail the job creation if notification fails
    }

    res.status(201).json(job);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCreateRequest'
 *     responses:
 *       200:
 *         description: Job updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Job not found
 */
router.put("/:id", auth, authorize("company"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const updates = req.body;
    const allowedUpdates = ["title", "description", "location", "type", "salary", "skills", "experience", "status", "openings"];

    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        job[key] = updates[key];
      }
    });

    await job.save();
    res.json(job);
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Job not found
 */
router.delete("/:id", auth, authorize("company"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await Application.deleteMany({ job: req.params.id });
    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
