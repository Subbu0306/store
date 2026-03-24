const express = require("express");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const authMiddleware = require("../middleware/auth"); 
const router = express.Router();
const mongoose = require("mongoose"); 

// ----------------------------------------------------------------------
// Check College ID Existence
// ----------------------------------------------------------------------
router.get("/check-college-id", authMiddleware(["admin", "employee"]), async (req, res) => {
  try {
    const collegeId = req.query.id; 

    if (!collegeId || collegeId.trim() === "" || collegeId.toUpperCase() === "N/A") {
      return res.status(200).json({ exists: false });
    }

    const existingSale = await Sale.findOne({
      'customer.college_id': collegeId
    }).select('_id'); 

    return res.status(200).json({ exists: !!existingSale });
  } catch (err) {
    console.error("Database check failed for College ID:", err.message);
    res.status(500).json({ message: "Server error during College ID check" });
  }
});

// ----------------------------------------------------------------------
// Log a sale (Employee only)
// ----------------------------------------------------------------------
router.post("/", authMiddleware(["admin", "employee"]), async (req, res) => {
  const { 
    items, 
    customerName, 
    collegeId, 
    customerContact, 
    customerEmail,
    paymentType,
    discountApplied = 0,
    discountType = "percentage",
    subtotal,
    totalAmount
  } = req.body;

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
        price: product.price,
      });
    }

    // Calculate subtotal if not provided
    const calculatedSubtotal = subtotal || updatedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantitySold);
    }, 0);

    // Calculate total if not provided
    let calculatedTotal = totalAmount;
    if (!calculatedTotal) {
      if (discountType === "percentage") {
        const discountAmount = calculatedSubtotal * (discountApplied / 100);
        calculatedTotal = calculatedSubtotal - discountAmount;
      } else {
        calculatedTotal = calculatedSubtotal - discountApplied;
      }
    }

    // Create a new sale record with discount fields
    const newSale = new Sale({
      employeeId: req.user._id,
      items: updatedItems,
      customer: {
        name: customerName || "Walk-in Customer",
        college_id: collegeId || "N/A",
        contact: customerContact || null,
        email: customerEmail || null,
      },
      paymentType: paymentType,
      discountApplied: discountApplied,
      discountType: discountType,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedTotal,
    });

    await newSale.save();

    res.status(201).json({ 
      message: "Sale logged successfully",
      sale: newSale 
    });
  } catch (err) {
    console.error("Error logging sale:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------------------------------------------------
// Fetch sales data
// ----------------------------------------------------------------------
router.get("/", authMiddleware(["admin", "employee"]), async (req, res) => {
  try {
    const { productName, startDate, endDate } = req.query;

    const query = {};
    if (productName) {
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
