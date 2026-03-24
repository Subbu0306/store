import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Correct import

const EmployeeSalesHistoryPage = () => {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem("token");

      // Decode the JWT token to get the user's ID
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id; // Extract the user ID from the token

      // Validate the token (optional)
      if (!userId) {
        console.error("Invalid or missing user ID in token");
        return;
      }

      // Fetch sales history for the employee
      const res = await axios.get(`http://localhost:5001/sales?employeeId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSales(res.data);
    } catch (err) {
      console.error("Error fetching sales history:", err.response?.data || err.message);
    }
  };

  return (
    <div className="p-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6">Sales History</h1>

      {/* Sales List Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">College ID</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Sale Date</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Quantity Sold</th>
            <th className="border p-2">Total Price</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <tr key={sale._id}>
                <td className="border p-2">{sale.customer?.name || "N/A"}</td>
                <td className="border p-2">{sale.customer?.college_id || "N/A"}</td>
                <td className="border p-2">{sale.customer?.contact || "N/A"}</td>
                <td className="border p-2">{sale.customer?.email || "N/A"}</td>
                <td className="border p-2">
                  {new Date(sale.saleDate).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <ul className="list-disc pl-5">
                    {sale.items.map((item, index) => (
                      <li key={index} className="text-sm">
                        {`${item.productId?.name} - Quantity Sold: ${item.quantitySold}`}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="border p-2">
                  {sale.items.reduce((sum, item) => sum + item.quantitySold, 0)}
                </td>
                <td className="border p-2">
                  {sale.items.reduce(
                    (totalPrice, item) =>
                      totalPrice +
                      (item.price * item.quantitySold || 0),
                    0
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="border p-2 text-center">
                No sales records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeSalesHistoryPage;