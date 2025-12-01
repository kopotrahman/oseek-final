// 🌟 server.js - OSEEK Backend
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { apiLimiter, authLimiter, sensitiveOpLimiter } = require("./middleware");

// 🚀 Import Routes
const {
  authRoutes,
  seekerProfileRoutes,
  companyProfileRoutes,
  jobRoutes,
  applicationRoutes,
  dashboardRoutes,
} = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 Middleware
app.use(cors());
app.use(bodyParser.json());

// 🛡️ Apply rate limiting
app.use("/api/", apiLimiter); // General rate limit for all API routes
app.use("/api/auth", authLimiter); // Stricter limit for auth routes

// 📚 Swagger Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "OSEEK API Documentation",
}));

// Swagger JSON endpoint
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// 🛣️ Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile/seeker", sensitiveOpLimiter, seekerProfileRoutes);
app.use("/api/profile/company", sensitiveOpLimiter, companyProfileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", sensitiveOpLimiter, applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 🗄️ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// 🔔 Default Route
app.get("/", (req, res) => {
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
  });
});

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ⚠️ Error Handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ⚡ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api/docs`);
});
