# OSEEK Job Portal - New Features API Documentation

This document describes the newly implemented features and their corresponding API endpoints.

## Table of Contents
1. [CV Download as PDF](#1-cv-download-as-pdf)
2. [Admin Role Management](#2-admin-role-management)
3. [Application Status Management](#3-application-status-management)
4. [Company Dashboard Analytics](#4-company-dashboard-analytics)
5. [Wishlist Reminder Emails](#5-wishlist-reminder-emails)
6. [Activity History](#6-activity-history)
7. [Wishlist/Save Jobs](#7-wishlistsave-jobs)
8. [Bulk Email to Applicants](#8-bulk-email-to-applicants)

---

## 1. CV Download as PDF

Job seekers can download their profile as a properly formatted CV in PDF format.

### Endpoint
```
GET /api/profile/seeker/download-cv
```

### Authentication
Required: Bearer token (Job Seeker role)

### Response
- **Content-Type**: `application/pdf`
- **File**: PDF document with seeker's profile information

### Example Usage
```bash
curl -X GET "http://localhost:5000/api/profile/seeker/download-cv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output resume.pdf
```

---

## 2. Admin Role Management

Admins can manage user roles and permissions.

### List All Users
```
GET /api/admin/users
```

**Query Parameters:**
- `role` (optional): Filter by role (seeker, company, admin)
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "count": 10,
  "users": [...]
}
```

### Update User Role
```
PUT /api/admin/users/:id/role
```

**Request Body:**
```json
{
  "role": "company"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {...}
}
```

### Delete User
```
DELETE /api/admin/users/:id
```

---

## 3. Application Status Management

Enhanced application statuses including interview and hired states.

### Available Statuses
- `pending` - Initial application state
- `reviewing` - Under review by company
- `shortlisted` - Candidate shortlisted
- `interview` - Interview scheduled
- `rejected` - Application rejected
- `hired` - Candidate hired
- `accepted` - Offer accepted

### Update Application Status
```
PUT /api/applications/:id/status
```

**Request Body:**
```json
{
  "status": "interview"
}
```

### View Application Status
```
GET /api/applications/my-applications
```

Job seekers can view all their applications with current status.

---

## 4. Company Dashboard Analytics

Enhanced dashboard with comprehensive analytics.

### Get Dashboard Stats
```
GET /api/dashboard/stats
```

**Response (Company):**
```json
{
  "totalJobs": 15,
  "activeJobs": 10,
  "totalApplications": 150,
  "totalViews": 2500,
  "totalWishlists": 45,
  "shortlistedCount": 20,
  "recentApplications": [...],
  "jobAnalytics": [
    {
      "jobId": "...",
      "title": "Software Engineer",
      "views": 350,
      "applications": 25,
      "wishlists": 8,
      "status": "open"
    }
  ]
}
```

### Call Applicant for Interview
```
POST /api/applications/:id/call-for-interview
```

**Request Body:**
```json
{
  "message": "We would like to invite you for an interview on Friday at 2 PM."
}
```

**Response:**
```json
{
  "message": "Interview invitation sent successfully",
  "application": {...}
}
```

---

## 5. Wishlist Reminder Emails

When a company posts a job, users who have similar jobs in their wishlist receive email notifications.

### How It Works
1. Company posts a new job
2. System finds users with similar jobs in wishlist
3. Email notifications sent automatically
4. Status tracked in Wishlist model

### Email Configuration
Add to `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@oseek.com
FRONTEND_URL=http://localhost:3000
```

**Note:** If email is not configured, emails will be logged to console for testing.

---

## 6. Activity History

Track all user activities including applications, wishlist actions, and interviews.

### Get Activity History
```
GET /api/dashboard/activity?limit=20
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10, max: 100)

**Response:**
```json
[
  {
    "type": "application_submitted",
    "description": "Applied to Software Engineer",
    "title": "Software Engineer",
    "timestamp": "2025-12-15T10:30:00Z",
    "metadata": {}
  },
  {
    "type": "interview_scheduled",
    "description": "Interview scheduled for Product Manager",
    "title": "Product Manager",
    "timestamp": "2025-12-14T15:00:00Z",
    "metadata": {
      "companyName": "Tech Corp"
    }
  }
]
```

### Activity Types
- `application_submitted` - Job application submitted
- `application_updated` - Application status changed
- `job_saved` - Job added to wishlist
- `job_unsaved` - Job removed from wishlist
- `interview_scheduled` - Interview scheduled
- `job_posted` - Company posted a job
- `profile_updated` - Profile information updated

---

## 7. Wishlist/Save Jobs

Job seekers can save jobs to their wishlist for later application.

### Add Job to Wishlist
```
POST /api/wishlist
```

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011"
}
```

### Get Wishlist
```
GET /api/wishlist
```

**Response:**
```json
[
  {
    "_id": "...",
    "user": "...",
    "job": {
      "_id": "...",
      "title": "Software Engineer",
      "company": {...}
    },
    "notified": false,
    "createdAt": "2025-12-15T10:30:00Z"
  }
]
```

### Remove from Wishlist
```
DELETE /api/wishlist/:jobId
```

### Check Wishlist Status
```
GET /api/wishlist/check/:jobId
```

**Response:**
```json
{
  "inWishlist": true
}
```

### Company View
Companies can see how many users have saved their jobs in the job analytics (`wishlistCount` field).

---

## 8. Bulk Email to Applicants

Companies can send bulk emails to applicants for a specific job position.

### Send Bulk Email
```
POST /api/applications/job/:jobId/bulk-email
```

**Request Body:**
```json
{
  "subject": "Interview Update",
  "message": "Thank you for applying. We will review your application and get back to you within 5 business days.",
  "status": "pending"
}
```

**Parameters:**
- `subject` (required): Email subject
- `message` (required): Email message body
- `status` (optional): Filter by application status (e.g., "pending", "shortlisted")

**Response:**
```json
{
  "message": "Bulk email sent",
  "total": 25,
  "success": 23,
  "failed": 2,
  "results": [
    {
      "to": "user1@example.com",
      "success": true,
      "error": null
    },
    {
      "to": "user2@example.com",
      "success": false,
      "error": "Invalid email address"
    }
  ]
}
```

---

## Database Models

### Wishlist Model
```javascript
{
  user: ObjectId,           // Reference to User
  job: ObjectId,            // Reference to Job
  notified: Boolean,        // Email notification sent
  createdAt: Date,
  updatedAt: Date
}
```

### ActivityLog Model
```javascript
{
  user: ObjectId,           // Reference to User
  type: String,             // Activity type
  description: String,      // Human-readable description
  relatedJob: ObjectId,     // Reference to Job (optional)
  relatedApplication: ObjectId, // Reference to Application (optional)
  metadata: Mixed,          // Additional data
  createdAt: Date,
  updatedAt: Date
}
```

### Enhanced Job Model
```javascript
{
  // ... existing fields
  viewsCount: Number,       // Total views
  wishlistCount: Number,    // Number of users who saved this job
}
```

### Enhanced Application Model
```javascript
{
  // ... existing fields
  status: String,  // pending, reviewing, shortlisted, interview, rejected, hired, accepted
}
```

---

## Testing Endpoints

### Using cURL

**Download CV:**
```bash
curl -X GET "http://localhost:5000/api/profile/seeker/download-cv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output resume.pdf
```

**Add to Wishlist:**
```bash
curl -X POST "http://localhost:5000/api/wishlist" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId": "507f1f77bcf86cd799439011"}'
```

**Send Bulk Email:**
```bash
curl -X POST "http://localhost:5000/api/applications/job/507f1f77bcf86cd799439011/bulk-email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Application Update",
    "message": "Thank you for your application. We will review it shortly."
  }'
```

**Call for Interview:**
```bash
curl -X POST "http://localhost:5000/api/applications/507f1f77bcf86cd799439011/call-for-interview" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "We would like to schedule an interview with you."
  }'
```

---

## Notes

1. **Email Service**: The email service will work in test mode (console logging) if email credentials are not configured. For production, configure the email service in `.env`.

2. **Authentication**: All endpoints require authentication except public job listings.

3. **Role-based Access**: Some endpoints are restricted to specific roles:
   - Admin-only: `/api/admin/*`
   - Company-only: Some `/api/applications/*` and `/api/jobs/*`
   - Seeker-only: `/api/wishlist/*`, `/api/profile/seeker/download-cv`

4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse.

5. **Swagger Documentation**: Full API documentation is available at `/api/docs` when the server is running.

---

## Future Enhancements

Potential improvements for future versions:
- Real-time notifications using WebSockets
- Advanced email templates with customization
- Scheduling system for interviews
- Video interview integration
- Resume parsing and matching
- AI-powered job recommendations
