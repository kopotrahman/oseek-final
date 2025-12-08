// api/server.js
// Vercel serverless wrapper — Vercel exposes this file under /api/*
// Make sure this file is at the repository root in an "api" directory.
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
