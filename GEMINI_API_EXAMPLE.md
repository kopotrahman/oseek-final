# Gemini API Integration - Example Usage

## Request/Response Examples

### Example 1: Successful Recommendation Request

#### Request
```http
GET /api/jobs/recommendations?limit=5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### User Profile (from database)
```json
{
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "experience": [
    {
      "title": "Full Stack Developer",
      "company": "Tech Corp",
      "duration": "2 years"
    }
  ],
  "education": [
    {
      "school": "University of Technology",
      "degree": "BS Computer Science",
      "year": "2021"
    }
  ],
  "location": "San Francisco, CA",
  "headline": "Passionate Full Stack Developer",
  "bio": "Building scalable web applications with modern technologies"
}
```

#### Response (With Gemini AI)
```json
{
  "recommendations": [
    {
      "job": {
        "_id": "65abc123def456789",
        "title": "Senior Full Stack Engineer",
        "description": "Join our team to build next-generation web applications...",
        "location": "San Francisco, CA",
        "type": "full-time",
        "skills": ["React", "Node.js", "TypeScript", "AWS"],
        "experience": "2-4 years",
        "salary": {
          "min": 120000,
          "max": 160000,
          "currency": "USD"
        },
        "company": {
          "email": "jobs@techcompany.com"
        }
      },
      "score": 0.87,
      "reasoning": "Excellent match: Your React and Node.js experience aligns perfectly with their full-stack requirements. Your 2 years of experience fits their 2-4 year range, and the San Francisco location matches your preference.",
      "breakdown": {
        "aiMatch": "87.0"
      }
    },
    {
      "job": {
        "_id": "65abc789def123456",
        "title": "Frontend Developer - React",
        "description": "Looking for a React specialist to join our growing team...",
        "location": "Remote",
        "type": "remote",
        "skills": ["React", "JavaScript", "Redux", "CSS"],
        "experience": "1-3 years",
        "salary": {
          "min": 100000,
          "max": 130000,
          "currency": "USD"
        }
      },
      "score": 0.82,
      "reasoning": "Strong match: Your React and JavaScript skills are core requirements. Remote position offers flexibility, and your experience level is ideal for this role.",
      "breakdown": {
        "aiMatch": "82.0"
      }
    },
    {
      "job": {
        "_id": "65abc456def789123",
        "title": "Backend Engineer - Node.js",
        "description": "Backend engineer needed for microservices architecture...",
        "location": "San Francisco, CA",
        "type": "full-time",
        "skills": ["Node.js", "MongoDB", "Docker", "Kubernetes"],
        "experience": "2-5 years",
        "salary": {
          "min": 130000,
          "max": 170000,
          "currency": "USD"
        }
      },
      "score": 0.78,
      "reasoning": "Good match: Your Node.js and MongoDB expertise aligns well. While this is more backend-focused than your full-stack background, your skills are highly relevant.",
      "breakdown": {
        "aiMatch": "78.0"
      }
    }
  ],
  "count": 3,
  "message": "Found 3 job recommendations based on your profile"
}
```

### Example 2: Fallback Algorithm Response

When Gemini API is not configured, the system uses the traditional algorithm:

#### Response (Fallback Algorithm)
```json
{
  "recommendations": [
    {
      "job": {
        "_id": "65abc123def456789",
        "title": "Senior Full Stack Engineer",
        "description": "Join our team to build next-generation web applications...",
        "location": "San Francisco, CA",
        "type": "full-time",
        "skills": ["React", "Node.js", "TypeScript", "AWS"],
        "experience": "2-4 years"
      },
      "score": 0.72,
      "breakdown": {
        "skillMatch": "75.0",
        "experienceMatch": "100.0",
        "locationMatch": "100.0",
        "keywordMatch": "68.0"
      }
    }
  ],
  "count": 1,
  "message": "Found 1 job recommendations based on your profile"
}
```

### Comparison: Gemini AI vs Traditional Algorithm

| Feature | Gemini AI | Traditional |
|---------|-----------|-------------|
| **Matching Logic** | Semantic understanding | Keyword + formula |
| **Reasoning** | ✅ Provided | ❌ Not provided |
| **Related Skills** | ✅ Recognizes (e.g., React/Next.js) | ❌ Exact match only |
| **Context Awareness** | ✅ Understands job descriptions | ❌ Limited |
| **Score Breakdown** | Single AI score | Multiple component scores |
| **Accuracy** | Higher | Good |
| **Setup Required** | API key needed | None |

## Testing the Integration

### 1. Without Gemini API Key (Fallback)

```bash
# Start server without GEMINI_API_KEY
npm start

# Make request
curl -X GET http://localhost:5000/api/jobs/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Server logs will show:
# "Using traditional algorithm (Gemini not configured)"
```

### 2. With Gemini API Key

```bash
# Set API key in .env
echo "GEMINI_API_KEY=your-key-here" >> .env

# Start server
npm start

# Make request (same as above)
curl -X GET http://localhost:5000/api/jobs/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Server logs will show:
# "Using Gemini AI for recommendations"
```

## Error Handling

### Case 1: Invalid API Key

```json
{
  "recommendations": [...],
  "count": 5,
  "message": "Found 5 job recommendations based on your profile"
}
```

**Note**: System automatically falls back to traditional algorithm. User experience is not interrupted.

**Server Logs**:
```
Gemini API error, falling back to traditional algorithm: Invalid API key
```

### Case 2: No Suitable Jobs

```json
{
  "recommendations": [],
  "count": 0,
  "message": "No suitable job recommendations found at this time. Try updating your profile with more skills and experience."
}
```

### Case 3: Profile Not Found

```json
{
  "message": "Please complete your profile to get job recommendations"
}
```

**Status Code**: 404

## Rate Limiting

### Free Tier Limits
- **Requests per minute**: 60
- **Requests per day**: 1,500

### Handling Rate Limits

If rate limit is exceeded, the system:
1. Catches the error
2. Logs: "Gemini API rate limit exceeded, falling back"
3. Uses traditional algorithm
4. Returns results normally

**User sees**: No difference in experience, just slightly different results

## Monitoring Usage

### Check API Usage

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. View your API key
3. Check usage statistics

### Server Logs

Monitor these log messages:
- ✅ "Using Gemini AI for recommendations" - Working correctly
- ⚠️ "Gemini API error, falling back..." - Using fallback (investigate)
- ℹ️ "Processing X out of Y jobs..." - Token limit protection active

## Best Practices

### For Development
```bash
# Use test API key
GEMINI_API_KEY=test-key-for-dev

# Test both modes
# 1. With key: Test AI recommendations
# 2. Without key: Test fallback
```

### For Production
```bash
# Use production API key
GEMINI_API_KEY=prod-key-with-higher-limits

# Monitor usage
# Set up alerts for:
# - High error rates
# - Rate limit approaching
# - Fallback usage increasing
```

## Integration Flow Diagram

```
User Request
    ↓
Check Profile Complete? → No → Return 404
    ↓ Yes
Check GEMINI_API_KEY set? → No → Use Traditional Algorithm
    ↓ Yes                           ↓
Call Gemini API                      Calculate Scores
    ↓                                ↓
Success? → No → Log Error → Use Traditional Algorithm
    ↓ Yes                            ↓
Parse Response                       ↓
    ↓                                ↓
Valid JSON? → No → Use Traditional Algorithm
    ↓ Yes                            ↓
Return Recommendations ←─────────────┘
```

## Summary

The Gemini AI integration provides:
- ✅ Smarter recommendations with semantic understanding
- ✅ AI-generated reasoning for each match
- ✅ Automatic fallback for reliability
- ✅ No breaking changes to existing API
- ✅ Easy configuration via environment variables
- ✅ Production-ready error handling

**Result**: Better user experience with intelligent job matching while maintaining system reliability.

---

**API Version**: 2.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
