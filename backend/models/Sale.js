const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantitySold: { type: Number, required: true },
      price: { type: Number, required: true }, // Add this field
    },
  ],
  customer: {
    name: { type: String, required: true },
    college_id: { type: String, required: true },
    contact: { type: String, required: false },
    email: { type: String, default: null },
  },
  saleDate: { type: Date, default: Date.now },
  paymentType: {type:String, required: true}
});

module.exports = mongoose.model("Sale", SaleSchema);