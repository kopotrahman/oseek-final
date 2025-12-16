const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Job, JobSeekerProfile, Application, Wishlist } = require("../models");

// Configuration constants
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MIN_MATCH_SCORE = 0.3;
const MAX_JOBS_PER_REQUEST = 50; // Limit to avoid token limits

/**
 * Check if Gemini API is available
 */
const isGeminiAvailable = () => {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "";
};

// Initialize Gemini AI
const initializeGemini = () => {
  if (!isGeminiAvailable()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

/**
 * Format user profile data for Gemini API
 */
const formatUserProfile = (profile) => {
  const userProfile = {
    skills: profile.skills || [],
    location: profile.location || "Not specified",
    experience: profile.experience?.map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
    })) || [],
    education: profile.education?.map(edu => ({
      school: edu.school,
      degree: edu.degree,
      year: edu.year,
    })) || [],
    headline: profile.headline || "",
    bio: profile.bio || "",
  };
  return userProfile;
};

/**
 * Format jobs data for Gemini API
 */
const formatJobs = (jobs) => {
  return jobs.map(job => ({
    id: job._id.toString(),
    title: job.title,
    description: job.description,
    location: job.location,
    type: job.type,
    skills: job.skills || [],
    experience: job.experience || "",
    salary: job.salary ? {
      min: job.salary.min,
      max: job.salary.max,
      currency: job.salary.currency,
    } : null,
  }));
};

/**
 * Get AI-powered job recommendations using Gemini API
 */
const getGeminiRecommendations = async (userId, limit = 10) => {
  try {
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

    // Limit jobs to avoid token limits
    const jobsToProcess = jobs.slice(0, MAX_JOBS_PER_REQUEST);
    if (jobs.length > MAX_JOBS_PER_REQUEST) {
      console.log(`Processing ${MAX_JOBS_PER_REQUEST} out of ${jobs.length} available jobs to stay within API limits`);
    }

    // Format data for Gemini
    const userProfile = formatUserProfile(profile);
    const formattedJobs = formatJobs(jobsToProcess);

    // Initialize Gemini
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Create the prompt for Gemini
    const prompt = `You are an AI job recommendation assistant. Analyze the following user profile and job listings to recommend the most suitable jobs.

User Profile:
- Skills: ${userProfile.skills.join(", ")}
- Location: ${userProfile.location}
- Headline: ${userProfile.headline}
- Bio: ${userProfile.bio}
- Experience: ${JSON.stringify(userProfile.experience)}
- Education: ${JSON.stringify(userProfile.education)}

Available Jobs:
${JSON.stringify(formattedJobs, null, 2)}

Task:
1. Analyze how well each job matches the user's profile based on:
   - Skills match
   - Experience level compatibility
   - Location compatibility (consider remote jobs favorably)
   - Educational background alignment
   - Career goals and interests

2. Return ONLY a valid JSON array of job recommendations in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "jobId": "job_id_here",
    "matchScore": 0.85,
    "reasoning": "Brief explanation of why this job is a good match"
  }
]

Rules:
- Return the top ${limit} most suitable jobs
- matchScore should be between 0 and 1 (higher is better)
- Sort by matchScore in descending order
- Only include jobs with matchScore >= ${MIN_MATCH_SCORE}
- Return an empty array [] if no suitable jobs found
- Return ONLY the JSON array, no other text`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the response
    let recommendations;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recommendations = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response");
      console.error("Parse error:", parseError.message);
      console.error("Response excerpt (first 200 chars):", text.substring(0, 200));
      // Fallback to empty array if parsing fails
      recommendations = [];
    }

    // Validate and format recommendations
    if (!Array.isArray(recommendations)) {
      console.error("Gemini response is not an array:", recommendations);
      return [];
    }

    // Match recommendations with full job data
    const recommendedJobs = recommendations
      .filter(rec => rec.jobId && rec.matchScore >= MIN_MATCH_SCORE)
      .map(rec => {
        const job = jobs.find(j => j._id.toString() === rec.jobId);
        if (!job) return null;

        return {
          job,
          score: rec.matchScore,
          reasoning: rec.reasoning || "AI-powered match",
          breakdown: {
            aiMatch: (rec.matchScore * 100).toFixed(1),
          },
        };
      })
      .filter(rec => rec !== null)
      .slice(0, limit);

    return recommendedJobs;
  } catch (error) {
    console.error("Gemini recommendation error:", error);
    throw error;
  }
};

module.exports = {
  getGeminiRecommendations,
  isGeminiAvailable,
};
