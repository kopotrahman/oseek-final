const express = require("express");
const router = express.Router();
const { JobSeekerProfile } = require("../models");
const { auth, authorize } = require("../middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Experience:
 *       type: object
 *       required:
 *         - title
 *         - company
 *         - duration
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         company:
 *           type: string
 *         duration:
 *           type: string
 *         description:
 *           type: string
 *     Education:
 *       type: object
 *       required:
 *         - school
 *         - degree
 *         - year
 *       properties:
 *         _id:
 *           type: string
 *         school:
 *           type: string
 *         degree:
 *           type: string
 *         year:
 *           type: string
 *     JobSeekerProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         location:
 *           type: string
 *         headline:
 *           type: string
 *         bio:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Experience'
 *         education:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Education'
 *         resumeUrl:
 *           type: string
 *         profileViews:
 *           type: number
 */

/**
 * @swagger
 * /api/profile/seeker:
 *   get:
 *     summary: Get current job seeker's profile
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job seeker profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobSeekerProfile'
 *       404:
 *         description: Profile not found
 */
router.get("/", auth, authorize("seeker"), async (req, res) => {
  try {
    let profile = await JobSeekerProfile.findOne({ user: req.user._id });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await JobSeekerProfile.create({
        user: req.user._id,
        fullName: req.user.name,
        email: req.user.email,
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker:
 *   put:
 *     summary: Update job seeker's profile
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               headline:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobSeekerProfile'
 */
router.put("/", auth, authorize("seeker"), async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ["fullName", "phone", "location", "headline", "bio", "resumeUrl"];
    const filteredUpdates = {};

    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: filteredUpdates },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/skills:
 *   post:
 *     summary: Add a skill to profile
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skill
 *             properties:
 *               skill:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skill added
 */
router.post("/skills", auth, authorize("seeker"), async (req, res) => {
  try {
    const { skill } = req.body;

    if (!skill || typeof skill !== "string") {
      return res.status(400).json({ message: "Skill is required" });
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { skills: skill.trim() } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Add skill error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/skills/{skill}:
 *   delete:
 *     summary: Remove a skill from profile
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skill
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill to remove
 *     responses:
 *       200:
 *         description: Skill removed
 */
router.delete("/skills/:skill", auth, authorize("seeker"), async (req, res) => {
  try {
    const { skill } = req.params;

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { skills: skill } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Remove skill error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/experience:
 *   post:
 *     summary: Add work experience
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Experience'
 *     responses:
 *       200:
 *         description: Experience added
 */
router.post("/experience", auth, authorize("seeker"), async (req, res) => {
  try {
    const { title, company, duration, description } = req.body;

    if (!title || !company || !duration) {
      return res.status(400).json({ message: "Title, company, and duration are required" });
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          experience: { title, company, duration, description },
        },
      },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Add experience error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/experience/{id}:
 *   put:
 *     summary: Update work experience
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Experience ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Experience'
 *     responses:
 *       200:
 *         description: Experience updated
 */
router.put("/experience/:id", auth, authorize("seeker"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, company, duration, description } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (title !== undefined) updateFields["experience.$.title"] = title;
    if (company !== undefined) updateFields["experience.$.company"] = company;
    if (duration !== undefined) updateFields["experience.$.duration"] = duration;
    if (description !== undefined) updateFields["experience.$.description"] = description;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id, "experience._id": id },
      { $set: updateFields },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Experience not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Update experience error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/experience/{id}:
 *   delete:
 *     summary: Delete work experience
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Experience ID
 *     responses:
 *       200:
 *         description: Experience deleted
 */
router.delete("/experience/:id", auth, authorize("seeker"), async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { experience: { _id: id } } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Delete experience error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/education:
 *   post:
 *     summary: Add education
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Education'
 *     responses:
 *       200:
 *         description: Education added
 */
router.post("/education", auth, authorize("seeker"), async (req, res) => {
  try {
    const { school, degree, year } = req.body;

    if (!school || !degree || !year) {
      return res.status(400).json({ message: "School, degree, and year are required" });
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          education: { school, degree, year },
        },
      },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Add education error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/education/{id}:
 *   put:
 *     summary: Update education
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Education ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Education'
 *     responses:
 *       200:
 *         description: Education updated
 */
router.put("/education/:id", auth, authorize("seeker"), async (req, res) => {
  try {
    const { id } = req.params;
    const { school, degree, year } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (school !== undefined) updateFields["education.$.school"] = school;
    if (degree !== undefined) updateFields["education.$.degree"] = degree;
    if (year !== undefined) updateFields["education.$.year"] = year;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id, "education._id": id },
      { $set: updateFields },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Education not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Update education error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/education/{id}:
 *   delete:
 *     summary: Delete education
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Education ID
 *     responses:
 *       200:
 *         description: Education deleted
 */
router.delete("/education/:id", auth, authorize("seeker"), async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { education: { _id: id } } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Delete education error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
