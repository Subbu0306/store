const express = require("express");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const authMiddleware = require("../middleware/auth"); 
const router = express.Router();
const mongoose = require("mongoose"); 

// ----------------------------------------------------------------------
// NEW ROUTE: Check College ID Existence
// Allows both Admin and Employee roles to access this check.
// ----------------------------------------------------------------------
router.get("/check-college-id", authMiddleware(["admin", "employee"]), async (req, res) => {
  try {
    const collegeId = req.query.id; 

    if (!collegeId || collegeId.trim() === "" || collegeId.toUpperCase() === "N/A") {
        // Treat default or empty IDs as non-existent for the check
        return res.status(200).json({ exists: false });
    }

    // Search the Sale collection for a sale with the matching college_id
    const existingSale = await Sale.findOne({
        'customer.college_id': collegeId
    }).select('_id'); 

    // If existingSale is not null, the ID exists
    const exists = !!existingSale; 

    return res.status(200).json({ 
        exists: exists 
    });

  } catch (err) {
    console.error("Database check failed for College ID:", err.message);
    res.status(500).json({ message: "Server error during College ID check" });
  }
});
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// Log a sale (Employee only)
// Requires 'employee' role authentication.
// ----------------------------------------------------------------------
router.post("/", authMiddleware(["employee"]), async (req, res) => {
  const { items, customerName, collegeId, customerContact, customerEmail,paymentType } = req.body;

  try {
    // Validate inputs
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one product is required" });
    }

    // Process each item in the sale
    const updatedItems = [];
    for (const item of items) {
      const { productId, quantitySold } = item;

      // Find the product by ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${productId}` });
      }

      // Check stock availability
      if (product.quantity < quantitySold) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
      }

      // Deduct quantity from stock
      product.quantity -= quantitySold;
      await product.save();

      // Add the product details to the updated items array
      updatedItems.push({
        productId,
        quantitySold,
        price: product.price, // Store the current price
      });
    }

    // Create a new sale record
    const newSale = new Sale({
      employeeId: req.user._id,
      items: updatedItems,
      customer: {
        name: customerName,
        college_id: collegeId,
        contact: customerContact || null,
        email: customerEmail || null,
      },
      paymentType: paymentType,
    });

    await newSale.save();

    res.status(201).json({ message: "Sale logged successfully" });
  } catch (err) {
    console.error("Error logging sale:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ----------------------------------------------------------------------
// Fetch sales data
// Requires 'admin' or 'employee' role authentication.
// ----------------------------------------------------------------------
router.get("/", authMiddleware(["admin", "employee"]), async (req, res) => {
  try {
    const { productName, startDate, endDate } = req.query;

    const query = {};
    if (productName) {
      // Ensure it's a valid ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(productName)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }
      query["items.productId"] = mongoose.Types.ObjectId(productName);
    }

    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.saleDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.saleDate = { $lte: new Date(endDate) };
    }

    const sales = await Sale.find(query)
      .populate("items.productId", "name price")
      .populate("employeeId", "username") 
      .sort({ saleDate: -1 });

    res.status(200).json(sales);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
