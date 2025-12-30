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

/**
 * AI-powered job description analysis and improvement suggestions
 */
const analyzeJobPosting = async (jobData) => {
  if (!isGeminiAvailable()) {
    throw new Error("Gemini API is not configured");
  }

  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are a job posting optimization expert. Analyze the following job posting and provide improvement suggestions.

Job Posting:
- Title: ${jobData.title}
- Description: ${jobData.description || "Not provided"}
- Location: ${jobData.location || "Not specified"}
- Type: ${jobData.type || "Not specified"}
- Skills Required: ${(jobData.skills || []).join(", ") || "None listed"}
- Experience: ${jobData.experience || "Not specified"}
- Salary Range: ${jobData.salary ? `${jobData.salary.min}-${jobData.salary.max} ${jobData.salary.currency}` : "Not specified"}

Provide your analysis in the following JSON format:
{
  "overallScore": <number 1-100>,
  "strengths": [<list of 2-3 positive aspects>],
  "improvements": [
    {
      "area": "<area to improve>",
      "suggestion": "<specific improvement suggestion>",
      "priority": "<high/medium/low>"
    }
  ],
  "suggestedKeywords": [<list of 3-5 keywords to add>],
  "competitiveness": "<rating: excellent/good/average/needs work>",
  "summary": "<2-3 sentence summary>"
}

Return ONLY the JSON object, no markdown or additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse and validate response
    let analysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini analysis response:", parseError);
      // Return a default analysis structure
      return {
        overallScore: 0,
        strengths: ["Unable to analyze at this time"],
        improvements: [],
        suggestedKeywords: [],
        competitiveness: "needs review",
        summary: "AI analysis temporarily unavailable. Please try again later.",
        error: true,
      };
    }

    return analysis;
  } catch (error) {
    console.error("Gemini job analysis error:", error);
    throw error;
  }
};

/**
 * AI-powered candidate-job matching analysis
 */
const analyzeCandidate = async (candidateProfile, jobData) => {
  if (!isGeminiAvailable()) {
    throw new Error("Gemini API is not configured");
  }

  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are an expert recruiter. Analyze how well this candidate matches the job requirements.

Candidate Profile:
- Name: ${candidateProfile.fullName || "Anonymous"}
- Headline: ${candidateProfile.headline || "Not provided"}
- Skills: ${(candidateProfile.skills || []).join(", ") || "None listed"}
- Location: ${candidateProfile.location || "Not specified"}
- Bio: ${candidateProfile.bio || "Not provided"}
- Experience: ${candidateProfile.experience?.map(e => `${e.title} at ${e.company} (${e.duration})`).join("; ") || "No experience listed"}
- Education: ${candidateProfile.education?.map(e => `${e.degree} from ${e.school} (${e.year})`).join("; ") || "No education listed"}

Job Requirements:
- Title: ${jobData.title}
- Description: ${jobData.description || "Not provided"}
- Required Skills: ${(jobData.skills || []).join(", ") || "None specified"}
- Experience Required: ${jobData.experience || "Not specified"}
- Location: ${jobData.location || "Not specified"}

Provide your analysis in the following JSON format:
{
  "matchScore": <number 0-100>,
  "skillsMatch": {
    "matched": [<list of matching skills>],
    "missing": [<list of missing but required skills>],
    "bonus": [<additional relevant skills the candidate has>]
  },
  "experienceMatch": "<assessment of experience fit>",
  "locationFit": "<assessment of location compatibility>",
  "strengths": [<list of 2-3 candidate strengths for this role>],
  "concerns": [<list of any concerns or gaps>],
  "recommendation": "<hire/consider/not recommended>",
  "summary": "<2-3 sentence overall assessment>"
}

Return ONLY the JSON object, no markdown or additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini candidate analysis:", parseError);
      return {
        matchScore: 0,
        skillsMatch: { matched: [], missing: [], bonus: [] },
        experienceMatch: "Unable to analyze",
        locationFit: "Unable to analyze",
        strengths: [],
        concerns: [],
        recommendation: "review manually",
        summary: "AI analysis temporarily unavailable.",
        error: true,
      };
    }

    return analysis;
  } catch (error) {
    console.error("Gemini candidate analysis error:", error);
    throw error;
  }
};

module.exports = {
  getGeminiRecommendations,
  isGeminiAvailable,
  analyzeJobPosting,
  analyzeCandidate,
};
