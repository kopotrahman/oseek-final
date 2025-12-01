// 🌟 server.js - OSEEK Backend
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// 🚀 Import Routes
// const authRoutes = require("./routes");
// const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 Middleware
app.use(cors());
app.use(bodyParser.json());

// 🛣️ Routes
// 


// 🗄️ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// 🔔 Default Route
app.get("/", (req, res) => {
  res.send("👋 Welcome to OSEEK API! Your dream job awaits!");
});

// ⚡ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
