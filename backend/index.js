const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({
  // Add BOTH your main Vercel URL and the specific "preview" URL from your logs
  origin: [
    "https://store-zrm5.vercel.app", 
    "https://store-zrm5-lpneey3au-subbu0306s-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/auth", require("./routes/auth"));

// Connect to MongoDB
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://sidewalksymphony13:vIjWUY1Z7sQZ8iui@cluster0.si9xmoc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });



// Routes
app.use("/auth", require("./routes/auth"));
app.use("/products", require("./routes/products"));
app.use("/sales", require("./routes/sales"));
app.use("/employees", require("./routes/employees")); // Add this line

// Start server
//const PORT = process.env.PORT || 5000;
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});


