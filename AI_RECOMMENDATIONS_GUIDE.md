# AI-Powered Job Recommendations System

## Overview

The OSEEK job portal now includes an intelligent recommendation system powered by **Google's Gemini AI** that matches job seekers with relevant job opportunities using advanced AI and natural language processing.

## How It Works

### Gemini AI Integration

The recommendation system now leverages **Google's Gemini AI** (gemini-1.5-flash model) to provide intelligent job matching:

1. **Data Collection**
   - User profile data: skills, experience, education, location, headline, bio
   - Available job postings: title, description, skills, location, experience requirements

2. **AI Processing**
   - Sends user profile and job listings to Gemini AI
   - Gemini analyzes semantic relationships between user qualifications and job requirements
   - AI considers context, synonyms, and implicit skill relationships
   - Returns ranked job recommendations with match scores and reasoning

3. **Fallback Algorithm**
   - If Gemini API is unavailable or not configured, system falls back to traditional weighted scoring
   - Ensures service reliability even without API key

### Traditional Algorithm (Fallback)

When Gemini API is not available, the system uses a **weighted scoring algorithm** that considers multiple factors:

1. **Skill Similarity (40% weight)**
   - Uses Jaccard similarity coefficient to compare user skills with job requirements
   - Exact skill matches are prioritized
   - Case-insensitive comparison

2. **Experience Match (20% weight)**
   - Extracts years of experience from user profile
   - Compares against job requirements
   - Handles various duration formats ("2 years", "Jan 2020 - Dec 2022")
   - Provides proportional scoring for partial matches

3. **Location Match (15% weight)**
   - Prioritizes remote jobs (1.0 score)
   - Exact location matches get full score
   - Partial matches (same city/state) get 0.7 score
   - Different locations get base score of 0.3

4. **Keyword Match (20% weight)**
   - Extracts keywords from user profile (bio, headline, skills, job titles)
   - Matches against job title and description
   - Uses natural language processing techniques

5. **Recency Bonus (5% weight)**
   - Recently posted jobs (< 7 days) get bonus
   - Jobs posted within last month get smaller bonus
   - Encourages early applications

### Exclusion Criteria

The system automatically excludes:
- Jobs the user has already applied to
- Jobs in the user's wishlist
- Closed or paused job postings

## API Endpoint

### Get Recommendations

```http
GET /api/jobs/recommendations?limit=10
Authorization: Bearer {token}
```

**Parameters:**
- `limit` (optional): Number of recommendations to return (default: 10)

**Response:**
```json
{
  "recommendations": [
    {
      "job": {
        "_id": "...",
        "title": "Senior Software Engineer",
        "description": "...",
        "location": "San Francisco, CA",
        "type": "full-time",
        "skills": ["JavaScript", "React", "Node.js"],
        "salary": {
          "min": 120000,
          "max": 180000,
          "currency": "USD"
        },
        "experience": "3-5 years"
      },
      "score": 0.75,
      "breakdown": {
        "skillMatch": "85.0",
        "experienceMatch": "90.0",
        "locationMatch": "70.0",
        "keywordMatch": "65.0"
      }
    }
  ],
  "count": 10,
  "message": "Found 10 job recommendations based on your profile"
}
```

## Frontend Integration

### Dashboard Display

The recommendations are automatically displayed on the job seeker's dashboard:

1. **AI-Powered Recommendations Section**
   - Shows top 5 recommended jobs
   - Displays overall match percentage
   - Shows breakdown of match scores
   - Click to view full job details

2. **Match Score Display**
   - Overall match percentage (e.g., 75%)
   - Individual component scores:
     - Skills: How well your skills match
     - Experience: How your experience aligns
     - Location: Geographic fit
     - Keywords: Content relevance

### Empty State

If no recommendations are available:
- Message prompts user to complete their profile
- Button to navigate to profile page
- Recommendations appear after profile is updated

## Configuration

### Environment Variables

**Required for Gemini AI:**
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

Add this to your `.env` file in the backend directory. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### Fallback Weights (Traditional Algorithm)

When Gemini is not available, the scoring weights can be adjusted in `recommendationService.js`:

```javascript
const totalScore =
  skillScore * 0.4 +        // 40% weight
  experienceScore * 0.2 +   // 20% weight
  locationScore * 0.15 +    // 15% weight
  keywordScore * 0.2 +      // 20% weight
  recencyBonus * 0.05;      // 5% weight
```

### Minimum Score Threshold

Jobs with scores below 0.3 (30% for Gemini) or 0.2 (20% for fallback) are filtered out:

```javascript
// Gemini
const relevantJobs = recommendations.filter(rec => rec.matchScore >= 0.3);

// Fallback
const relevantJobs = jobsWithScores.filter(item => item.score >= 0.2);
```

## Best Practices

### For Job Seekers

To get better recommendations:

1. **Complete Your Profile**
   - Add all relevant skills
   - Include detailed experience with durations
   - Fill in location preferences
   - Write a descriptive bio with industry keywords
   - Add a professional headline

2. **Keep Profile Updated**
   - Update skills as you learn new technologies
   - Add new experiences
   - Refresh your bio periodically

3. **Use the System**
   - Check recommendations regularly
   - Apply to recommended jobs
   - Save interesting jobs to wishlist

### For Companies

To appear in recommendations:

1. **Write Clear Job Descriptions**
   - List specific skill requirements
   - Include relevant keywords
   - Specify experience level clearly

2. **Tag Properly**
   - Add all relevant skills
   - Set appropriate job type (remote, full-time, etc.)
   - Specify accurate location

3. **Keep Jobs Fresh**
   - Recently posted jobs get priority
   - Update job descriptions periodically

## Performance Considerations

### Optimization Features

1. **Efficient Querying**
   - Excludes already-applied and wishlisted jobs
   - Only processes open positions
   - Uses MongoDB lean() for faster queries

2. **Caching Recommendations**
   - Frontend caches recommendations on dashboard
   - Refreshes when navigating back to dashboard

3. **Scalability**
   - Limit parameter prevents excessive processing
   - Default limit of 10 recommendations
   - Maximum practical limit is 50

## Security

### Data Privacy

- Only accessible to authenticated job seekers
- User data never shared with other users
- Recommendations are personalized and private

### Authorization

- Requires valid JWT token
- Role must be "seeker"
- Cannot access other users' recommendations

## Troubleshooting

### No Recommendations Showing

**Possible Causes:**
1. Profile incomplete (no skills, experience)
2. All open jobs already applied to or wishlisted
3. No jobs match minimum score threshold (20%)

**Solutions:**
1. Complete your profile with more details
2. Browse and apply to new jobs
3. Broaden your skill set or location preferences

### Low Match Scores

**Possible Causes:**
1. Skills don't match available jobs
2. Experience level mismatch
3. Location preferences too restrictive
4. Profile keywords don't align with job market

**Solutions:**
1. Update skills with in-demand technologies
2. Adjust experience expectations
3. Consider remote positions
4. Use industry-standard terminology in profile

## Future Enhancements

Potential improvements for future versions:

1. **Collaborative Filtering**
   - Recommendations based on similar users
   - "Users like you also applied to..."

2. **Learning from User Behavior**
   - Track which recommendations users apply to
   - Adjust weights based on successful matches

3. **Industry-Specific Models**
   - Custom weights for different industries
   - Tech, finance, healthcare-specific algorithms

4. **Real-time Updates**
   - WebSocket notifications for new matching jobs
   - Push notifications for high-match opportunities

5. **Explainability**
   - Detailed explanation of why each job was recommended
   - Highlight matching skills and keywords

## Technical Implementation

### Files Modified/Created

**Backend:**
- `backend/utils/geminiRecommendationService.js` - **NEW** Gemini AI integration
- `backend/utils/recommendationService.js` - Updated to use Gemini with fallback
- `backend/routes/jobs.js` - API endpoint (unchanged)
- `backend/.env.example` - Added GEMINI_API_KEY configuration

**Frontend:**
- `frontend/src/pages/Dashboard.jsx` - UI display
- `frontend/src/config/api.js` - API configuration

### Dependencies

**New Dependencies:**
- `@google/generative-ai` (v0.24.1) - Google Gemini AI SDK

**Existing Dependencies:**
- Mongoose for database queries
- Express for API routing
- React for UI components

## Examples

### Example 1: High Match Score (85%)

**User Profile:**
- Skills: JavaScript, React, Node.js, MongoDB
- Experience: 4 years as Full Stack Developer
- Location: San Francisco, CA

**Job Posting:**
- Title: Senior Full Stack Engineer
- Skills: React, Node.js, MongoDB, TypeScript
- Experience: 3-5 years
- Location: San Francisco, CA (Hybrid)

**Score Breakdown:**
- Skills: 75% (3/4 skills match)
- Experience: 100% (4 years fits 3-5 range)
- Location: 100% (exact match)
- Keywords: 85% (developer, full stack, etc.)
- Total: 85%

### Example 2: Medium Match Score (55%)

**User Profile:**
- Skills: Python, Django, PostgreSQL
- Experience: 2 years as Backend Developer
- Location: Austin, TX

**Job Posting:**
- Title: Backend Engineer
- Skills: Python, FastAPI, AWS, Docker
- Experience: 2-4 years
- Location: Remote

**Score Breakdown:**
- Skills: 25% (1/4 skills match)
- Experience: 100% (2 years fits 2-4 range)
- Location: 100% (remote job)
- Keywords: 70% (backend, engineer, etc.)
- Total: 55%

## Conclusion

The AI-powered recommendation system significantly improves the job search experience by:
- Saving time browsing through irrelevant jobs
- Increasing application success rates
- Matching candidates with suitable opportunities
- Providing transparency through score breakdowns

For questions or issues, please contact the development team.

## Gemini AI Features

### Advantages Over Traditional Algorithm

1. **Semantic Understanding**
   - Understands context and meaning, not just keyword matching
   - Recognizes related skills (e.g., React and Next.js, Python and Django)
   - Interprets job descriptions in natural language

2. **Intelligent Reasoning**
   - Provides explanations for each recommendation
   - Considers implicit qualifications and transferable skills
   - Better handles edge cases and ambiguous data

3. **Continuous Improvement**
   - Benefits from Google's ongoing model improvements
   - Stays current with industry trends and terminology
   - No manual weight tuning required

4. **Flexibility**
   - Adapts to various job types and industries
   - Handles incomplete or sparse profile data better
   - More robust to data quality issues

### API Usage Example

```javascript
const { getRecommendedJobs } = require('./utils/recommendationService');

// Will automatically use Gemini if GEMINI_API_KEY is set
const recommendations = await getRecommendedJobs(userId, 10);
```

---

**Version:** 2.0 (Gemini AI Integration)  
**Last Updated:** December 2024  
**Status:** Production Ready with AI ✅
