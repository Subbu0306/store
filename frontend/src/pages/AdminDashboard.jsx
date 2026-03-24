import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [stockLevels, setStockLevels] = useState([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch total sales
      const salesResponse = await axios.get('${import.meta.env.VITE_API_URL}/sales', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Filter sales made today
      const todaySales = salesResponse.data.filter(sale => {
        const saleDate = new Date(sale.saleDate).toISOString().split("T")[0];
        return saleDate === today;
      });

      // Count today's sales
      setTotalSales(todaySales.length);

      // Calculate total amount for today's sales
      const totalAmountToday = todaySales.reduce(
        (sum, sale) =>
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantitySold * item.price, 0),
        0
      );

      setTotalAmount(totalAmountToday);

      // Fetch stock levels
      const productsResponse = await axios.get('${import.meta.env.VITE_API_URL}/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStockLevels(productsResponse.data);
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err.response?.data || err.message);
    }
  };

  return (
    <div className="p-8">
      {/* Welcome Message */}
      <h1 className="text-3xl font-bold mb-6">Welcome, Admin!</h1>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Sales & Amount Card */}
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md flex justify-between items-center">
          {/* Left - Total Sales */}
          <div className="text-left space-y-7">
            <h2 className="text-xl font-semibold">Total Sales</h2>
            <p className="text-3xl font-bold">{totalSales}</p>
          </div>

          {/* Right - Total Amount */}
          <div className="text-right space-y-7">
            <h2 className="text-xl font-semibold">Total Amount</h2>
            <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Stock Levels Card */}
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center">Current Stock Levels</h2>

          {/* Scrollable List */}
          <div className="mt-4 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent">
            {stockLevels.length > 0 ? (
              <ul>
                {stockLevels.map((product) => (
                  <li key={product._id} className="flex justify-between text-sm mb-2 border-b border-gray-300 pb-1 pr-4">
                    <span>{product.name}</span>
                    <span>{product.quantity} units</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm">No products available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Manage Products Card */}
        <div className="bg-blue-500 hover:bg-blue-600 transition duration-300 text-white p-8 rounded-lg shadow-md text-center">
          <a href="/admin/products" className="text-xl font-bold block">
            Manage Products
          </a>
          <p className="mt-2">Add, edit, or delete products.</p>
        </div>

        {/* Manage Employees Card */}
        <div className="bg-green-500 hover:bg-green-600 transition duration-300 text-white p-8 rounded-lg shadow-md text-center">
          <a href="/admin/employees" className="text-xl font-bold block">
            Manage Employees
          </a>
          <p className="mt-2">Add or remove employees.</p>
        </div>

        {/* View Sales History Card */}
        <div className="bg-purple-500 hover:bg-purple-600 transition duration-300 text-white p-8 rounded-lg shadow-md text-center">
          <a href="/admin/sales" className="text-xl font-bold block">
            View Sales History
          </a>
          <p className="mt-2">View all sales records.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
