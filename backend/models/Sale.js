const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantitySold: {
        type: Number,
        required: true,
        min: 0.01,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  customer: {
    name: { type: String, default: "Walk-in Customer" },
    college_id: { type: String, default: "N/A" },
    contact: { type: String, default: null },
    email: { type: String, default: null },
  },
  paymentType: {
    type: String,
    enum: ["Cash", "Card"],
    required: true,
  },
  // NEW DISCOUNT FIELDS
  discountApplied: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "percentage",
  },
  subtotal: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Sale", SaleSchema);
