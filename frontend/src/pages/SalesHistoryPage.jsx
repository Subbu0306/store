import React, { useEffect, useState } from "react";
import axios from "axios";

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [filters, setFilters] = useState({
    productName: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5001/sales";

      const queryParams = [];
      if (filters.productName) queryParams.push(`productName=${filters.productName}`);
      if (filters.startDate) queryParams.push(`startDate=${filters.startDate}`);
      if (filters.endDate) queryParams.push(`endDate=${filters.endDate}`);

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data);
    } catch (err) {
      console.error("Error fetching sales:", err.response?.data || err.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApplyFilters = () => {
    fetchSales();
  };

  // 👉 CSV Export Function
  const exportToCSV = async () => {
    try {
      const token = localStorage.getItem("token");
  
      // 1️⃣ Fetch all products from the store to define column headers
      const productRes = await axios.get("${process.env.REACT_APP_API_URL}/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allProducts = productRes.data; // Assume it returns a list of all products in store
      const productNames = allProducts.map(product => product.name);
  
      // 2️⃣ Define CSV headers
      const header = [
        "Student Name",
        "College ID",
        "Contact",
        "Email",
        "Sale Date",
        "Employee",
        ...productNames,
        "paymentType",  // Dynamic product columns
        "Total Price"
      ];
  
      // 3️⃣ Generate CSV rows
      const rows = sales.map((sale) => {
        // Create a product quantity mapping for the current sale
        const productQuantities = Object.fromEntries(productNames.map(name => [name, 0]));
  
        // Fill purchased product quantities
        sale.items.forEach((item) => {
          if (item.productId?.name) {
            productQuantities[item.productId.name] = item.quantitySold;
          }
        });
  
        // Compute total price
        const totalPrice = sale.items.reduce((sum, item) => sum + (item.price * item.quantitySold || 0), 0);
  
        return [
          sale.customer?.name || "N/A",
          sale.customer?.college_id || "N/A",
          sale.customer?.contact || "N/A",
          sale.customer?.email || "N/A",
          new Date(sale.saleDate).toLocaleDateString(),
          sale.employeeId?.username || "N/A",
          ...productNames.map(name => productQuantities[name]), // Fill quantities dynamically
          sale.paymentType || "N/A",
          totalPrice
        ];
      });
  
      // 4️⃣ Convert data to CSV format
      const csvContent = [
        header.join(","), 
        ...rows.map(r => r.join(","))
      ].join("\n");
  
      // 5️⃣ Create Blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "sales-history.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };
  

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sales History</h1>

      {/* Filters Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="productName"
            placeholder="Product Name"
            value={filters.productName}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApplyFilters}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300"
          >
            Apply Filters
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-300"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <h2 className="text-xl font-semibold mb-4">All Sales</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">College ID</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Sale Date</th>
            <th className="border p-2">Employee</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Quantity Sold</th>
            <th className="border p-2">Payment</th>
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
                <td className="border p-2">{new Date(sale.saleDate).toLocaleDateString()}</td>
                <td className="border p-2">{sale.employeeId?.username || "N/A"}</td>
                <td className="border p-2">
                  <ul className="list-disc pl-5">
                    {sale.items.map((item, index) => (
                      <li key={index} className="text-sm">
                        {`${item.productId?.name} - Qty: ${item.quantitySold}`}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="border p-2">
                  {sale.items.reduce((sum, item) => sum + item.quantitySold, 0)}
                </td>
                <td className="border p-2">
  {sale.paymentType || "N/A"} {/* Check for paymentType directly */}
</td>
                <td className="border p-2">
                  {sale.items.reduce((sum, item) => sum + (item.price * item.quantitySold || 0), 0)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="border p-2 text-center">
                No sales records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesHistoryPage;
