const express = require("express");
const cors = require("cors");
const { FRONTEND_URL } = require("./config/env");
const errorHandler = require("./middlewares/error.middleware");

// Routes
const uploadRoutes = require("./routes/upload.routes");
const aiRoutes = require("./routes/ai.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000","https://legal-gurdian.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Legal Guardian API", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/upload", uploadRoutes);
app.use("/api", aiRoutes);
app.use("/api/chat", chatRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
