const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/auth"); // Add middleware for admin-only access

const router = express.Router();

// Add product (Admin only)
router.post("/", authMiddleware(["admin"]), async (req, res) => {
  const { name, price, quantity } = req.body;

  try {
    const product = new Product({ name, price, quantity });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Products (Admin and Employee)
router.get("/", authMiddleware(["admin", "employee"]), async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Product (Admin Only)
router.put("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { price, quantity } = req.body;

    // Find the product by ID and update it
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { price, quantity },
      { new: true } // Return the updated document
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Product (Admin Only)
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;