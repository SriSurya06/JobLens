require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");
const { errorHandler } = require("./src/middleware/error.middleware");
// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes = require("./src/routes/auth.routes");
const studentRoutes = require("./src/routes/student.routes");
const onCampusRoutes = require("./src/routes/oncampus.routes");
const offCampusRoutes = require("./src/routes/offcampus.routes");
const roundRoutes = require("./src/routes/round.routes");
const feedbackRoutes = require("./src/routes/feedback.routes");
const coordinatorRoutes = require("./src/routes/coordinator.routes");
const jobVerifierRoutes = require("./src/routes/jobVerifier.routes"); // ← NEW
const chatbotRoutes = require('./src/routes/chatbot.routes');
// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();
const app = express();
// ── Global middleware ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ── Static file serving for uploads ──────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res
    .status(200)
    .json({
      success: true,
      message: "CCPDMS API is running",
      timestamp: new Date(),
    }),
);
// ── Mount routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/oncampus", onCampusRoutes);
app.use("/api/offcampus", offCampusRoutes);
app.use("/api/rounds", roundRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/student/job-verifier", jobVerifierRoutes); // ← NEW
app.use('/api/student/chatbot', chatbotRoutes);
// ── 404 handler
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "API route not found" }),
);
// ── Global error handler (must be last)
app.use(errorHandler);
// ── Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  CCPDMS API running on port ${PORT}`);
  console.log(`📋  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗  Health: http://localhost:${PORT}/api/health\n`);
});
module.exports = app;