# Gemini AI Integration Setup Guide

## Overview

This guide will help you set up Google's Gemini AI for intelligent job recommendations in the OSEEK platform.

## Prerequisites

- Node.js installed (v14 or higher)
- OSEEK backend running
- Google Cloud account (free tier available)

## Step 1: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Step 2: Configure Environment Variables

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create or edit your `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your-actual-api-key-here
   ```

## Step 3: Install Dependencies

If you haven't already installed the dependencies:

```bash
cd backend
npm install
```

The `@google/generative-ai` package will be installed automatically.

## Step 4: Start the Server

```bash
npm start
# or for development
npm run dev
```

## Step 5: Test the Integration

### Using the API

Make a request to the recommendations endpoint:

```bash
curl -X GET http://localhost:5000/api/jobs/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Logs

The server will log when it's using Gemini AI:
- "Using Gemini AI for recommendations" - Gemini is active
- "Gemini API error, falling back..." - Using fallback algorithm

## Features

### With Gemini AI Enabled

✅ Advanced semantic understanding of skills and requirements  
✅ Context-aware job matching  
✅ AI-generated reasoning for each recommendation  
✅ Better handling of related and transferable skills  
✅ Natural language processing of job descriptions  

### Without Gemini API Key (Fallback Mode)

✅ Traditional weighted scoring algorithm  
✅ Skill similarity using Jaccard coefficient  
✅ Experience and location matching  
✅ Keyword-based filtering  
✅ Full functionality without API costs  

## Troubleshooting

### "GEMINI_API_KEY is not configured" Error

**Solution:** Ensure your `.env` file contains:
```env
GEMINI_API_KEY=your-actual-key
```

Restart the server after adding the key.

### API Rate Limits

Gemini API has rate limits. If you hit them:
- The system automatically falls back to the traditional algorithm
- No data loss or service interruption
- Consider upgrading your Google Cloud plan for higher limits

### Invalid API Key

**Symptoms:** Recommendations work but logs show Gemini errors

**Solution:** 
1. Verify your API key is correct
2. Check if the key is still active in Google AI Studio
3. Ensure no extra spaces or quotes around the key in `.env`

### No Recommendations Returned

**Possible causes:**
1. User profile is incomplete
2. All jobs already applied to or in wishlist
3. No jobs match minimum score threshold

**Solution:**
- Complete user profile with skills, experience, location
- Ensure there are open job postings in the database
- Check server logs for specific errors

## API Costs

### Free Tier (Google AI Studio)

- 60 requests per minute
- 1,500 requests per day
- Free for development and testing

### Paid Tier (Google Cloud)

For production use with high traffic, consider Google Cloud:
- Pay per request
- Higher rate limits
- Better SLA

Visit [Google Cloud Pricing](https://cloud.google.com/vertex-ai/pricing) for details.

## Best Practices

### Development

1. Use Gemini API for realistic testing
2. Set reasonable rate limits
3. Monitor API usage in Google AI Studio

### Production

1. Use environment-specific API keys
2. Implement caching for frequent requests
3. Monitor error rates and fallback usage
4. Set up alerts for API quota limits

### Security

1. **Never commit API keys to Git**
2. Use environment variables for all environments
3. Rotate API keys periodically
4. Restrict API key usage by IP or domain if possible

## Performance Tips

1. **Cache Recommendations**
   - Store recommendations temporarily
   - Refresh only when profile changes

2. **Batch Requests**
   - Process multiple users in batches during off-peak hours
   - Pre-generate recommendations for active users

3. **Monitor Usage**
   - Track API calls per user
   - Set per-user rate limits if needed

## Migration from Traditional Algorithm

The system automatically uses Gemini when available. No code changes needed:

```javascript
// Automatically detects Gemini API key
const recommendations = await getRecommendedJobs(userId, limit);
```

To force traditional algorithm (for testing):
1. Remove or comment out `GEMINI_API_KEY` in `.env`
2. Restart server

## Comparison

| Feature | Traditional | Gemini AI |
|---------|------------|-----------|
| Semantic understanding | ❌ | ✅ |
| Context awareness | Limited | Advanced |
| Related skills | ❌ | ✅ |
| Reasoning provided | ❌ | ✅ |
| Setup complexity | None | API key needed |
| Cost | Free | Free tier + paid |
| Fallback support | N/A | Yes |

## Support

For issues related to:
- **Gemini API:** Visit [Google AI Studio Help](https://ai.google.dev/docs)
- **OSEEK Platform:** Create an issue in the repository
- **Integration:** Check logs and documentation above

## Next Steps

1. ✅ Set up Gemini API key
2. ✅ Test recommendations endpoint
3. ✅ Monitor logs for successful AI integration
4. 📝 Customize prompts in `geminiRecommendationService.js` if needed
5. 📊 Monitor API usage and costs
6. 🚀 Deploy to production

---

**Last Updated:** December 2024  
**Integration Version:** 2.0  
**Gemini Model:** gemini-1.5-flash
