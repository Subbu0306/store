import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; 

const EmployeeDashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [stockLevels, setStockLevels] = useState([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch total sales
      const salesResponse = await axios.get("http://localhost:5001/sales", {
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
      const productsResponse = await axios.get("http://localhost:5001/products", {
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
      <h1 className="text-3xl font-bold mb-6">Welcome, Employee!</h1>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Sales Card */}
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold">Total Sales</h2>
          <p className="text-3xl font-bold">{totalSales}</p>
        </div>

        {/* Stock Levels Card */}
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-center">Current Stock Levels</h2>
          <ul className="mt-4">
            {stockLevels.length > 0 ? (
              stockLevels.map((product) => (
                <li key={product._id} className="flex justify-between text-sm mb-2">
                  <span>{product.name}</span>
                  <span>{product.quantity} units</span>
                </li>
              ))
            ) : (
              <p className="text-center text-sm">No products available.</p>
            )}
          </ul>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Log Sale Card */}
        <div className="bg-blue-500 hover:bg-blue-600 transition duration-300 text-white p-8 rounded-lg shadow-md text-center">
          <a href="/employee/sales" className="text-xl font-bold block">
            Log a Sale
          </a>
          <p className="mt-2">Record a new sale transaction.</p>
        </div>

        {/* View Sales History Card */}
        <div className="bg-purple-500 hover:bg-purple-600 transition duration-300 text-white p-8 rounded-lg shadow-md text-center">
          <a href="/employee/sales-history" className="text-xl font-bold block">
            View Sales History
          </a>
          <p className="mt-2">View your past sales records.</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;