const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
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
    const allowedUpdates = ["fullName", "phone", "location", "headline", "bio", "resumeUrl", "profilePicture"];
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

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

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

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

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

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

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

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

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

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

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

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Delete education error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/seeker-profile/download-cv:
 *   get:
 *     summary: Download profile as CV (PDF)
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CV PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/download-cv", auth, authorize("seeker"), async (req, res) => {
  try {
    const profile = await JobSeekerProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Create PDF document with custom page size and margins
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });

    // Sanitize filename to prevent header injection
    const sanitizedName = (profile.fullName || "CV")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .substring(0, 50);
    
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedName}_Resume.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Define colors matching web design
    const primaryColor = '#0066ff';
    const accentColor = '#00d9ff';
    const textColor = '#333333';
    const lightTextColor = '#666666';
    
    // Add profile picture if available
    if (profile.profilePicture) {
      try {
        // Extract base64 data if it includes data URL prefix
        let imageData = profile.profilePicture;
        if (imageData.startsWith('data:')) {
          imageData = imageData.split(',')[1];
        }
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageData, 'base64');
        
        // Add profile picture centered at top
        const imageSize = 80;
        const pageWidth = doc.page.width;
        const imageX = (pageWidth - imageSize) / 2;
        
        doc.image(imageBuffer, imageX, 50, { 
          fit: [imageSize, imageSize],
          align: 'center'
        });
        
        doc.moveDown(6); // Space after image
      } catch (imgError) {
        console.error("Error adding profile picture to CV:", imgError);
        // Continue without image if there's an error
        doc.moveDown(1);
      }
    } else {
      doc.moveDown(1);
    }

    // Header with name - styled with color
    doc.fontSize(28)
       .fillColor(primaryColor)
       .font("Helvetica-Bold")
       .text(profile.fullName || "Job Seeker", { align: "center" });
    doc.moveDown(0.3);

    // Headline - styled with accent color
    if (profile.headline) {
      doc.fontSize(14)
         .fillColor(accentColor)
         .font("Helvetica-Bold")
         .text(profile.headline, { align: "center" });
      doc.moveDown(0.5);
    }

    // Contact info - compact and centered
    doc.fontSize(10)
       .fillColor(lightTextColor)
       .font("Helvetica");
    
    const contactInfo = [];
    if (profile.email) contactInfo.push(`📧 ${profile.email}`);
    if (profile.phone) contactInfo.push(`📱 ${profile.phone}`);
    if (profile.location) contactInfo.push(`📍 ${profile.location}`);
    
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join("  •  "), { align: "center" });
      doc.moveDown(1.5);
    }

    // Add a horizontal line separator
    doc.strokeColor(primaryColor)
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    doc.moveDown(1);

    // Bio/Summary section
    if (profile.bio) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("PROFESSIONAL SUMMARY");
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font("Helvetica")
         .text(profile.bio, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // Skills section with better formatting
    if (profile.skills && profile.skills.length > 0) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("SKILLS");
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font("Helvetica")
         .text(profile.skills.join("  •  "), { align: 'left' });
      doc.moveDown(1.5);
    }

    // Experience section with enhanced layout
    if (profile.experience && profile.experience.length > 0) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("WORK EXPERIENCE");
      doc.moveDown(0.5);

      profile.experience.forEach((exp, index) => {
        // Job title in bold
        doc.fontSize(12)
           .fillColor(textColor)
           .font("Helvetica-Bold")
           .text(exp.title);
        
        // Company and duration with accent color
        doc.fontSize(10)
           .fillColor(accentColor)
           .font("Helvetica")
           .text(`${exp.company}  •  ${exp.duration}`);
        
        // Description
        if (exp.description) {
          doc.fontSize(10)
             .fillColor(textColor)
             .font("Helvetica")
             .text(exp.description, { 
               indent: 20,
               paragraphGap: 5
             });
        }
        
        if (index < profile.experience.length - 1) {
          doc.moveDown(0.8);
        }
      });

      doc.moveDown(1.5);
    }

    // Education section with enhanced layout
    if (profile.education && profile.education.length > 0) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("EDUCATION");
      doc.moveDown(0.5);

      profile.education.forEach((edu, index) => {
        // Degree in bold
        doc.fontSize(12)
           .fillColor(textColor)
           .font("Helvetica-Bold")
           .text(edu.degree);
        
        // School and year with accent color
        doc.fontSize(10)
           .fillColor(accentColor)
           .font("Helvetica")
           .text(`${edu.school}  •  ${edu.year}`);
        
        if (index < profile.education.length - 1) {
          doc.moveDown(0.8);
        }
      });

      doc.moveDown(1.5);
    }

    // Footer with branding
    const footerY = doc.page.height - 70;
    if (doc.y < footerY) {
      doc.y = footerY;
    }
    
    // Add separator line
    doc.strokeColor(primaryColor)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(8)
       .fillColor(lightTextColor)
       .font("Helvetica")
       .text("Generated from OSEEK Job Portal", { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Download CV error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/{userId}/download-cv:
 *   get:
 *     summary: Download job seeker's CV as PDF (for companies who received applications)
 *     tags: [Job Seeker Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job seeker user ID
 *     responses:
 *       200:
 *         description: CV PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Not authorized - user has not applied to your jobs
 *       404:
 *         description: Profile not found
 */
router.get("/:userId/download-cv", auth, authorize("company"), async (req, res) => {
  try {
    const { Application, Job } = require("../models");
    
    // Verify that this seeker has applied to at least one job from this company
    const hasApplied = await Application.findOne({
      applicant: req.params.userId
    }).populate('job');
    
    if (!hasApplied) {
      return res.status(403).json({ message: "Not authorized to download this CV" });
    }
    
    // Check if the job belongs to the requesting company
    const jobBelongsToCompany = await Job.findOne({
      _id: hasApplied.job._id,
      company: req.user._id
    });
    
    if (!jobBelongsToCompany) {
      return res.status(403).json({ message: "Not authorized to download this CV" });
    }

    const profile = await JobSeekerProfile.findOne({ user: req.params.userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Create PDF document with custom page size and margins
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });

    // Sanitize filename to prevent header injection
    const sanitizedName = (profile.fullName || "CV")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .substring(0, 50);
    
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedName}_Resume.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Define colors matching web design
    const primaryColor = '#0066ff';
    const accentColor = '#00d9ff';
    const textColor = '#333333';
    const lightTextColor = '#666666';
    
    // Add profile picture if available
    if (profile.profilePicture) {
      try {
        // Extract base64 data if it includes data URL prefix
        let imageData = profile.profilePicture;
        if (imageData.startsWith('data:')) {
          imageData = imageData.split(',')[1];
        }
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageData, 'base64');
        
        // Add profile picture centered at top
        const imageSize = 80;
        const pageWidth = doc.page.width;
        const imageX = (pageWidth - imageSize) / 2;
        
        doc.image(imageBuffer, imageX, 50, { 
          fit: [imageSize, imageSize],
          align: 'center'
        });
        
        doc.moveDown(6); // Space after image
      } catch (imgError) {
        console.error("Error adding profile picture to CV:", imgError);
        // Continue without image if there's an error
        doc.moveDown(1);
      }
    } else {
      doc.moveDown(1);
    }

    // Header with name - styled with color
    doc.fontSize(28)
       .fillColor(primaryColor)
       .font("Helvetica-Bold")
       .text(profile.fullName || "Job Seeker", { align: "center" });
    doc.moveDown(0.3);

    // Headline - styled with accent color
    if (profile.headline) {
      doc.fontSize(14)
         .fillColor(accentColor)
         .font("Helvetica-Bold")
         .text(profile.headline, { align: "center" });
      doc.moveDown(0.5);
    }

    // Contact info - compact and centered
    doc.fontSize(10)
       .fillColor(lightTextColor)
       .font("Helvetica");
    
    const contactInfo = [];
    if (profile.email) contactInfo.push(`📧 ${profile.email}`);
    if (profile.phone) contactInfo.push(`📱 ${profile.phone}`);
    if (profile.location) contactInfo.push(`📍 ${profile.location}`);
    
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join("  •  "), { align: "center" });
      doc.moveDown(1.5);
    }

    // Add a horizontal line separator
    doc.strokeColor(primaryColor)
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    doc.moveDown(1);

    // Bio/Summary section
    if (profile.bio) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("PROFESSIONAL SUMMARY");
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font("Helvetica")
         .text(profile.bio, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // Skills section with better formatting
    if (profile.skills && profile.skills.length > 0) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("SKILLS");
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font("Helvetica")
         .text(profile.skills.join("  •  "), { align: 'left' });
      doc.moveDown(1.5);
    }

    // Experience section with enhanced layout
    if (profile.experience && profile.experience.length > 0) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("WORK EXPERIENCE");
      doc.moveDown(0.5);

      profile.experience.forEach((exp, index) => {
        // Job title in bold
        doc.fontSize(12)
           .fillColor(textColor)
           .font("Helvetica-Bold")
           .text(exp.title);
        
        // Company and duration with accent color
        doc.fontSize(10)
           .fillColor(accentColor)
           .font("Helvetica")
           .text(`${exp.company}  •  ${exp.duration}`);
        
        // Description
        if (exp.description) {
          doc.fontSize(10)
             .fillColor(textColor)
             .font("Helvetica")
             .text(exp.description, { 
               indent: 20,
               paragraphGap: 5
             });
        }
        
        if (index < profile.experience.length - 1) {
          doc.moveDown(0.8);
        }
      });

      doc.moveDown(1.5);
    }

    // Education section with enhanced layout
    if (profile.education && profile.education.length > 0) {
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("EDUCATION");
      doc.moveDown(0.5);

      profile.education.forEach((edu, index) => {
        // Degree in bold
        doc.fontSize(12)
           .fillColor(textColor)
           .font("Helvetica-Bold")
           .text(edu.degree);
        
        // School and year with accent color
        doc.fontSize(10)
           .fillColor(accentColor)
           .font("Helvetica")
           .text(`${edu.school}  •  ${edu.year}`);
        
        if (index < profile.education.length - 1) {
          doc.moveDown(0.8);
        }
      });

      doc.moveDown(1.5);
    }

    // Footer with branding
    const footerY = doc.page.height - 70;
    if (doc.y < footerY) {
      doc.y = footerY;
    }
    
    // Add separator line
    doc.strokeColor(primaryColor)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(8)
       .fillColor(lightTextColor)
       .font("Helvetica")
       .text("Generated from OSEEK Job Portal", { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Download applicant CV error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/profile/seeker/{id}:
 *   get:
 *     summary: Get public job seeker profile by ID
 *     tags: [Job Seeker Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job seeker profile ID or user ID
 *     responses:
 *       200:
 *         description: Job seeker profile
 *       404:
 *         description: Profile not found
 */
router.get("/:id", async (req, res) => {
  try {
    const profile = await JobSeekerProfile.findById(req.params.id)
      .populate('user', 'name')
      .select('-email -phone -profileViews'); // Exclude sensitive fields for public view
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get seeker profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
