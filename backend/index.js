const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({
  origin: ["https://your-app-name.vercel.app", "http://localhost:3000"], // Allow both production and local dev
  credentials: true
}));
app.use(express.json());





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


