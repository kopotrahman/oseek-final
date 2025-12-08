// backend/app.js
// Exports the configured Express app (no app.listen). Reuses your existing middleware, routes, and swagger.
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { apiLimiter, authLimiter, sensitiveOpLimiter } = require("./middleware");

// Import Routes (same as your server.js)
const {
  authRoutes,
  seekerProfileRoutes,
  companyProfileRoutes,
  jobRoutes,
  applicationRoutes,
  dashboardRoutes,
} = require("./routes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rate limiting
app.use("/api/auth", authLimiter);
app.use("/api/", apiLimiter);

// Swagger Documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "OSEEK API Documentation",
  })
);

// Swagger JSON endpoint
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile/seeker", sensitiveOpLimiter, seekerProfileRoutes);
app.use("/api/profile/company", sensitiveOpLimiter, companyProfileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", sensitiveOpLimiter, applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// MongoDB connection (guarded by connection state to reduce repeated connects in serverless)
if (!mongoose.connection.readyState) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch((err) => console.log("❌ MongoDB connection error:", err));
}

// Default route
app.get("/", (req, res) =>
  res.json({
    message: "👋 Welcome to OSEEK API! Your dream job awaits!",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      seekerProfile: "/api/profile/seeker",
      companyProfile: "/api/profile/company",
      jobs: "/api/jobs",
      applications: "/api/applications",
      dashboard: "/api/dashboard",
    },
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
