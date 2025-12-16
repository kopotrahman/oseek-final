const { Job, JobSeekerProfile, Application, Wishlist } = require("../models");
const { getGeminiRecommendations } = require("./geminiRecommendationService");

/**
 * Calculate similarity score between user skills and job requirements
 * Uses Jaccard similarity coefficient
 */
const calculateSkillSimilarity = (userSkills, jobSkills) => {
  if (!userSkills || !jobSkills || userSkills.length === 0 || jobSkills.length === 0) {
    return 0;
  }

  // Normalize skills to lowercase for comparison
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());

  // Calculate intersection
  const intersection = normalizedUserSkills.filter(skill =>
    normalizedJobSkills.includes(skill)
  ).length;

  // Calculate union
  const union = new Set([...normalizedUserSkills, ...normalizedJobSkills]).size;

  // Jaccard similarity
  return union > 0 ? intersection / union : 0;
};

/**
 * Calculate experience match score
 * Extracts years from experience string and compares
 */
const calculateExperienceScore = (userExperience, jobExperience) => {
  if (!jobExperience || !userExperience || userExperience.length === 0) {
    return 0.5; // Neutral score if no experience data
  }

  // Extract years from job requirement (e.g., "2-3 years" -> 2)
  const jobYearsMatch = jobExperience.match(/(\d+)/);
  const jobYears = jobYearsMatch ? parseInt(jobYearsMatch[1]) : 0;

  // Calculate total years from user experience
  let totalUserYears = 0;
  userExperience.forEach(exp => {
    // Try to extract years from duration (e.g., "2 years", "Jan 2020 - Dec 2022")
    const yearsMatch = exp.duration.match(/(\d+)\s*(year|yr)/i);
    if (yearsMatch) {
      totalUserYears += parseInt(yearsMatch[1]);
    } else {
      // Estimate from date range if present
      const dateMatch = exp.duration.match(/\d{4}/g);
      if (dateMatch && dateMatch.length >= 2) {
        const years = parseInt(dateMatch[dateMatch.length - 1]) - parseInt(dateMatch[0]);
        totalUserYears += Math.max(0, years);
      }
    }
  });

  // Score based on experience match
  if (totalUserYears === 0) return 0.3;
  if (totalUserYears >= jobYears) return 1.0;
  // Proportional score if less experience
  return Math.min(totalUserYears / jobYears, 1.0);
};

/**
 * Calculate location match score
 * Handles remote jobs and location matching
 */
const calculateLocationScore = (userLocation, jobLocation, jobType) => {
  if (!userLocation || !jobLocation) return 0.5;

  // Remote jobs get bonus score
  if (jobType === "remote" || jobLocation.toLowerCase().includes("remote")) {
    return 1.0;
  }

  // Normalize locations
  const normalizedUserLoc = userLocation.toLowerCase().trim();
  const normalizedJobLoc = jobLocation.toLowerCase().trim();

  // Exact match
  if (normalizedUserLoc === normalizedJobLoc) return 1.0;

  // Partial match (e.g., same city or state)
  if (normalizedUserLoc.includes(normalizedJobLoc) || normalizedJobLoc.includes(normalizedUserLoc)) {
    return 0.7;
  }

  return 0.3; // Different locations
};

/**
 * Extract keywords from user profile (bio, headline, skills)
 */
const extractUserKeywords = (profile) => {
  const keywords = new Set();

  // Add skills
  if (profile.skills) {
    profile.skills.forEach(skill => keywords.add(skill.toLowerCase().trim()));
  }

  // Extract keywords from headline (simple word extraction)
  if (profile.headline) {
    const headlineWords = profile.headline.toLowerCase().match(/\b\w{3,}\b/g) || [];
    headlineWords.forEach(word => keywords.add(word));
  }

  // Extract keywords from bio
  if (profile.bio) {
    const bioWords = profile.bio.toLowerCase().match(/\b\w{3,}\b/g) || [];
    bioWords.forEach(word => keywords.add(word));
  }

  // Add job titles from experience
  if (profile.experience) {
    profile.experience.forEach(exp => {
      const titleWords = exp.title.toLowerCase().match(/\b\w{3,}\b/g) || [];
      titleWords.forEach(word => keywords.add(word));
    });
  }

  return Array.from(keywords);
};

/**
 * Calculate keyword match score between user profile and job
 */
const calculateKeywordScore = (userKeywords, job) => {
  if (!userKeywords || userKeywords.length === 0) return 0.3;

  const jobText = `${job.title} ${job.description}`.toLowerCase();
  let matchCount = 0;

  userKeywords.forEach(keyword => {
    if (jobText.includes(keyword)) {
      matchCount++;
    }
  });

  return Math.min(matchCount / Math.max(userKeywords.length * 0.3, 1), 1.0);
};

/**
 * Calculate recency bonus
 * Newer jobs get slightly higher scores
 */
const calculateRecencyBonus = (jobCreatedAt) => {
  const daysSinceCreated = (Date.now() - new Date(jobCreatedAt)) / (1000 * 60 * 60 * 24);

  if (daysSinceCreated < 7) return 0.1; // Posted in last week
  if (daysSinceCreated < 30) return 0.05; // Posted in last month
  return 0;
};

/**
 * Main recommendation algorithm
 * Returns recommended jobs for a user with relevance scores
 * Now uses Gemini API for AI-powered filtering
 */
const getRecommendedJobs = async (userId, limit = 10) => {
  try {
    // Check if Gemini API is available
    const useGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";
    
    if (useGemini) {
      // Use Gemini AI for recommendations
      try {
        return await getGeminiRecommendations(userId, limit);
      } catch (geminiError) {
        console.error("Gemini API error, falling back to traditional algorithm:", geminiError);
        // Fall back to traditional algorithm if Gemini fails
      }
    }

    // Traditional algorithm (fallback when Gemini is not available or fails)
    // Get user profile
    const profile = await JobSeekerProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("User profile not found");
    }

    // Get jobs user has already applied to
    const applications = await Application.find({ applicant: userId }).select("job");
    const appliedJobIds = applications.map(app => app.job.toString());

    // Get jobs in user's wishlist
    const wishlistItems = await Wishlist.find({ user: userId }).select("job");
    const wishlistJobIds = wishlistItems.map(item => item.job.toString());

    // Get all open jobs (exclude already applied or in wishlist)
    const jobs = await Job.find({
      status: "open",
      _id: { $nin: [...appliedJobIds, ...wishlistJobIds] },
    }).populate("company", "email").lean();

    if (jobs.length === 0) {
      return [];
    }

    // Extract user keywords
    const userKeywords = extractUserKeywords(profile);

    // Calculate scores for each job
    const jobsWithScores = jobs.map(job => {
      // Skill similarity (40% weight)
      const skillScore = calculateSkillSimilarity(profile.skills, job.skills);

      // Experience match (20% weight)
      const experienceScore = calculateExperienceScore(profile.experience, job.experience);

      // Location match (15% weight)
      const locationScore = calculateLocationScore(profile.location, job.location, job.type);

      // Keyword match (20% weight)
      const keywordScore = calculateKeywordScore(userKeywords, job);

      // Recency bonus (5% weight)
      const recencyBonus = calculateRecencyBonus(job.createdAt);

      // Calculate total weighted score
      const totalScore =
        skillScore * 0.4 +
        experienceScore * 0.2 +
        locationScore * 0.15 +
        keywordScore * 0.2 +
        recencyBonus * 0.05;

      return {
        job,
        score: totalScore,
        breakdown: {
          skillMatch: (skillScore * 100).toFixed(1),
          experienceMatch: (experienceScore * 100).toFixed(1),
          locationMatch: (locationScore * 100).toFixed(1),
          keywordMatch: (keywordScore * 100).toFixed(1),
        },
      };
    });

    // Sort by score (highest first) and return top N
    jobsWithScores.sort((a, b) => b.score - a.score);

    // Filter out jobs with very low scores (< 0.2)
    const relevantJobs = jobsWithScores.filter(item => item.score >= 0.2);

    return relevantJobs.slice(0, limit);
  } catch (error) {
    console.error("Recommendation error:", error);
    throw error;
  }
};

module.exports = {
  getRecommendedJobs,
  calculateSkillSimilarity,
  calculateExperienceScore,
  calculateLocationScore,
  extractUserKeywords,
};
