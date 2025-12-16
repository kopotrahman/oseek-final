# Activity History Logic Documentation

## Overview

The OSEEK platform tracks user activities through the `ActivityLog` model. This document explains when and how activity logs are created for different user actions.

## Activity Log Model

**Location:** `backend/models/ActivityLog.js`

### Schema Fields

- `user`: Reference to the User who performed the action
- `type`: Type of activity (enum of predefined activity types)
- `description`: Human-readable description of the activity
- `relatedJob`: Optional reference to a Job (if activity is job-related)
- `relatedApplication`: Optional reference to an Application (if activity is application-related)
- `metadata`: Additional data about the activity (flexible object)
- `timestamps`: Automatically managed `createdAt` and `updatedAt` fields

### Activity Types

```javascript
[
  "application_submitted",      // When seeker applies to a job
  "application_updated",         // When application status changes
  "job_saved",                   // When seeker adds job to wishlist
  "job_unsaved",                 // When seeker removes job from wishlist
  "interview_scheduled",         // When company calls seeker for interview
  "job_posted",                  // When company posts a new job
  "job_updated",                 // When company updates a job
  "job_closed",                  // When company closes a job
  "profile_updated",             // When user updates their profile
  "application_received",        // When company receives an application
  "applicant_shortlisted",       // When company shortlists an applicant
  "applicant_rejected",          // When company rejects an applicant
  "applicant_hired",             // When company hires an applicant
]
```

## Activity Log Triggers

### 1. Application Submitted
**Route:** `POST /api/applications`  
**File:** `backend/routes/applications.js`  
**Triggered by:** Job seeker applying to a job

```javascript
await ActivityLog.create({
  user: req.user._id,
  type: "application_submitted",
  description: `Applied to ${job.title}`,
  relatedJob: jobId,
  relatedApplication: application._id,
});
```

**When it happens:**
- Seeker successfully submits an application to a job
- After application is saved to database
- Only if job status is "open"

---

### 2. Application Status Updated
**Route:** `PUT /api/applications/:id/status`  
**File:** `backend/routes/applications.js`  
**Triggered by:** Company updating application status

```javascript
await ActivityLog.create({
  user: application.applicant,
  type: "application_updated",
  description: `Application status updated to ${status} for ${application.job.title}`,
  relatedJob: application.job._id,
  relatedApplication: application._id,
});
```

**When it happens:**
- Company changes application status (pending, reviewing, shortlisted, interview, rejected, hired, accepted)
- Activity is logged for the applicant (not the company)
- Includes job and application references

---

### 3. Interview Scheduled
**Route:** `POST /api/applications/:id/call-for-interview`  
**File:** `backend/routes/applications.js`  
**Triggered by:** Company sending interview invitation

```javascript
await ActivityLog.create({
  user: application.applicant._id,
  type: "interview_scheduled",
  description: `Interview scheduled for ${application.job.title}`,
  relatedJob: application.job._id,
  relatedApplication: application._id,
  metadata: { companyName },
});
```

**When it happens:**
- Company sends interview invitation to applicant
- After email is sent successfully
- Application status is automatically updated to "interview"
- Metadata includes company name for context

---

### 4. Profile Updated
**Routes:** 
- `PUT /api/profile/seeker` (Job Seeker)
- `PUT /api/profile/company` (Company)

**Files:** 
- `backend/routes/seekerProfile.js`
- `backend/routes/companyProfile.js`

**Triggered by:** User updating their profile information

**Seeker Profile Update:**
```javascript
await ActivityLog.create({
  user: req.user._id,
  type: "profile_updated",
  description: "Updated profile information",
  metadata: { updatedFields: Object.keys(filteredUpdates) },
});
```

**Company Profile Update:**
```javascript
await ActivityLog.create({
  user: req.user._id,
  type: "profile_updated",
  description: "Updated company profile",
  metadata: { updatedFields: Object.keys(filteredUpdates) },
});
```

**When it happens:**
- User updates profile fields (name, bio, location, skills, etc.)
- After profile is successfully saved to database
- Metadata includes list of updated fields
- Doesn't fail the profile update if logging fails

---

### 5. Job Actions (Not Yet Implemented)

The following activity types are defined but not yet tracked:

#### job_saved / job_unsaved
- **Should trigger:** When seeker adds/removes job from wishlist
- **Route:** `POST /api/wishlist` or `DELETE /api/wishlist/:jobId`
- **Implementation needed:** Add activity logging to wishlist routes

#### job_posted
- **Should trigger:** When company creates a new job
- **Route:** `POST /api/jobs`
- **Implementation needed:** Add activity logging after job creation

#### job_updated
- **Should trigger:** When company updates a job (title, description, status, etc.)
- **Route:** `PUT /api/jobs/:id`
- **Implementation needed:** Add activity logging after job update

#### job_closed
- **Should trigger:** When company changes job status to "closed"
- **Route:** `PUT /api/jobs/:id` (with status: "closed")
- **Implementation needed:** Add specific logging when status changes to closed

#### application_received
- **Should trigger:** When company receives a new application
- **Current:** Notification is created but no activity log
- **Implementation needed:** Add activity logging for company user

#### applicant_shortlisted / applicant_rejected / applicant_hired
- **Should trigger:** When application status changes to these specific statuses
- **Current:** Generic "application_updated" is logged
- **Implementation needed:** Add specific activity types based on status

---

## Activity History Display

### Dashboard Activity Feed
**Route:** `GET /api/dashboard/stats`  
**File:** `backend/routes/dashboard.js`

Shows recent activity in the dashboard:
- For seekers: Recent application submissions with status
- For companies: Recent applications received to their jobs

### Full Activity History
**Route:** `GET /api/dashboard/activity`  
**File:** `backend/routes/dashboard.js`

**Parameters:**
- `limit`: Number of activities to return (default: 10, max: 100)

**Features:**
- Returns activity logs from `ActivityLog` collection
- Falls back to generating activities from Applications/Jobs if no logs exist
- Sorts by creation date (most recent first)
- Includes populated references to jobs and applications

**Response Format:**
```javascript
{
  activities: [
    {
      _id: "...",
      type: "application_submitted",
      description: "Applied to Senior Developer",
      relatedJob: {
        title: "Senior Developer",
        _id: "..."
      },
      createdAt: "2024-01-15T10:30:00Z",
      metadata: { ... }
    }
  ]
}
```

---

## Frontend Display

### Activity Icons
Based on activity type, different icons are shown:
- `application_submitted`: Briefcase icon
- `interview_scheduled`: Calendar icon
- `profile_updated`: User icon
- `job_posted`: Plus icon
- etc.

### Activity Descriptions
Human-readable descriptions are generated based on:
- Activity type
- Related job title
- User names (for company activities)
- Metadata (additional context)

---

## Best Practices for Activity Logging

### 1. Always Use Try-Catch
```javascript
try {
  await ActivityLog.create({ ... });
} catch (activityError) {
  console.error("Error logging activity:", activityError);
  // Don't fail the main request if activity logging fails
}
```

### 2. Include Relevant References
- Always include `user` (who performed the action)
- Include `relatedJob` if job-related
- Include `relatedApplication` if application-related
- Add useful metadata for future reference

### 3. Use Descriptive Messages
```javascript
description: `Applied to ${job.title}`  // ✅ Good
description: "Application submitted"     // ❌ Too generic
```

### 4. Don't Block Main Operations
- Activity logging should never cause the main operation to fail
- Always wrap in try-catch
- Log errors but continue execution

---

## Future Enhancements

### Recommended Activity Types to Add
1. **profile_viewed**: When someone views a profile
2. **connection_requested**: When seeker sends connection request
3. **connection_accepted**: When connection is accepted
4. **message_sent**: If messaging feature is added
5. **skill_added**: When seeker adds a new skill
6. **job_viewed**: When seeker views a job posting

### Analytics Opportunities
1. Track most active users
2. Measure time between activities (e.g., application to interview)
3. Identify drop-off points in hiring funnel
4. User engagement metrics
5. Popular job types based on activity

### Performance Considerations
1. Add indexes on frequently queried fields:
   - `user` + `createdAt` (already exists)
   - `type` for filtering by activity type
   - `relatedJob` for job-specific activity
2. Consider archiving old activity logs (> 1 year)
3. Implement pagination for large activity lists

---

## Testing Activity Logs

### Manual Testing Steps
1. **Application Flow:**
   - Apply to a job → Check activity log created
   - Company updates status → Check applicant's activity log
   - Company calls for interview → Check activity log + notification

2. **Profile Updates:**
   - Update seeker profile → Check activity log with metadata
   - Update company profile → Check activity log with metadata

3. **Dashboard Display:**
   - Check recent activity shows correct activities
   - Verify full activity history with pagination

### Database Queries for Testing
```javascript
// Get all activities for a user
db.activitylogs.find({ user: ObjectId("...") }).sort({ createdAt: -1 })

// Get activities by type
db.activitylogs.find({ type: "interview_scheduled" })

// Get activities for a specific job
db.activitylogs.find({ relatedJob: ObjectId("...") })
```

---

## Conclusion

The activity history system provides a comprehensive audit trail of user actions in the OSEEK platform. While core functionality is implemented, there are opportunities to expand tracking for additional actions and improve analytics capabilities.

**Status:** ✅ Core features implemented  
**Last Updated:** December 2024
