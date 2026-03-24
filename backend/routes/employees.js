const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Add a new employee (Admin only)
router.post("/", authMiddleware(["admin"]), async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create a new employee
    const newEmployee = new User({
      username,
      password,
      role: "employee",
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all employees (Admin only)
router.get("/", authMiddleware(["admin"]), async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password"); // Exclude passwords
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an employee (Admin only)
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;