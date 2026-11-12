
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const connectDB = require("./config/db");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const User = require("./models/User");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const visitorWorkflowRoutes = require("./routes/visitorWorkflowRoutes");
const blacklistRoutes = require("./routes/blacklistRoutes");
const qrRoutes = require("./routes/qrRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const settingRoutes = require("./routes/settingRoutes");
const emailLogRoutes = require("./routes/emailLogRoutes");
const activityRoutes = require("./routes/activityRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const startAppointmentReminderService = require("./services/appointmentReminderService");
const transporter = require("./config/emailConfig");

const { setIO } = require("./utils/socket");

// ===============================
// EXPRESS APP
// ===============================

const app = express();
const server = http.createServer(app);

// ===============================
// ALLOWED FRONTEND ORIGINS
// ===============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://visitor-management-system-zya4.vercel.app",
];

// ===============================
// SOCKET.IO CONFIGURATION
// ===============================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make Socket.IO available to notification utility
setIO(io);

// ===============================
// SOCKET AUTHENTICATION
// ===============================

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return next(new Error("Invalid authentication token"));
    }

    const user = await User.findById(userId).select(
      "_id name role isActive"
    );

    if (!user || !user.isActive) {
      return next(new Error("User is not authorized"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Socket authentication failed"));
  }
});

// ===============================
// SOCKET CONNECTION
// ===============================

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();

  socket.join(`user:${userId}`);

  console.log(`Socket connected: ${socket.user.name}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.user.name}`);
  });
});

// ===============================
// EMAIL VERIFICATION
// ===============================

transporter.verify((error) => {
  if (error) {
    console.log("SMTP Connection Failed:", error.message);
  } else {
    console.log("VisitPro SMTP Server Ready!");
  }
});

// ===============================
// SECURITY MIDDLEWARE
// ===============================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// ===============================
// CORS CONFIGURATION
// ===============================

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked CORS Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

// ===============================
// BODY PARSER
// ===============================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// STATIC UPLOADS
// ===============================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ===============================
// ROOT API
// ===============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Visitor Management System API is running!",
  });
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  const isDatabaseConnected =
    mongoose.connection.readyState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,

    message: isDatabaseConnected
      ? "Server and database are healthy"
      : "Database is not connected",

    database: isDatabaseConnected
      ? "Connected"
      : "Disconnected",

    timestamp: new Date().toISOString(),
  });
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/visitor-workflow", visitorWorkflowRoutes);
app.use("/api/blacklist", blacklistRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/email-logs", emailLogRoutes);
app.use("/api/activity-logs", activityRoutes);
app.use("/api/analytics", analyticsRoutes);

// ===============================
// 404 HANDLER
// ===============================

app.use(notFound);

// ===============================
// GLOBAL ERROR HANDLER
// ===============================

app.use(errorHandler);

// ===============================
// START SERVER
// ===============================

const startServer = async () => {
  try {
    await connectDB();

    startAppointmentReminderService();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log("--------------------------------");
      console.log("VISITOR MANAGEMENT SYSTEM");
      console.log(`Server running on port ${PORT}`);
      console.log(`Health: /api/health`);
      console.log("Socket.IO: Enabled");
      console.log("--------------------------------");
    });
  } catch (error) {
    console.error(
      "Application startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
