const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ========== CORS - MUST BE FIRST ==========
app.use(cors({
  origin: ["https://store-zrm5.vercel.app", "http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== JSON PARSING ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== DEBUG LOGGING ==========
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('   Body:', req.body);
  }
  next();
});

// ========== DATABASE CONNECTION ==========
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://sidewalksymphony13:vIjWUY1Z7sQZ8iui@cluster0.si9xmoc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ========== ROUTES ==========
// IMPORTANT: Don't require User model here! It's only needed in individual route files
app.use("/auth", require("./routes/auth"));
app.use("/products", require("./routes/products"));
app.use("/sales", require("./routes/sales"));
app.use("/employees", require("./routes/employees"));

// ========== TEST ENDPOINTS ==========
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Student Store API is running",
    endpoints: ["/auth/login", "/products", "/sales", "/employees", "/health"]
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Allowed origins: https://store-zrm5.vercel.app, http://localhost:5173`);
});
