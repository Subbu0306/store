import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import moment from 'moment';

const LogSalePage = () => {
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [saleData, setSaleData] = useState({
    items: [],
    customerName: "Walk-in Customer",
    collegeId: "N/A",
    customerContact: "",
    customerEmail: "",
    paymentType: "",
  });
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [changeToReturn, setChangeToReturn] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [graphData, setGraphData] = useState({ top: [], bottom: [] });
  const [loading, setLoading] = useState({
    products: false,
    sales: false
  });
  const [successMessage, setSuccessMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Add these new state variables to your component (assuming React's useState)
  const [collegeIdError, setCollegeIdError] = useState(null); // Holds the error message or null
  const [isCheckingId, setIsCheckingId] = useState(false);   // To show a loading indicator
  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
console.log(products)
  // Calculate sales metrics
  const calculateSalesMetrics = () => {
    if (!todaySales.length || !products.length) return { totalRevenue: 0, totalSales: 0, averageSale: 0 };

    const totalRevenue = todaySales.reduce((total, sale) => {
      const saleTotal = sale.items.reduce((sum, item) => {
        const product = products.find(p => p._id === (item.productId?._id || item.productId));
        return sum + (product?.price || 0) * (item.quantitySold || 0);
      }, 0);
      return total + saleTotal;
    }, 0)

    const totalSales = todaySales.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalSales,
      averageSale: parseFloat(averageSale.toFixed(2))
    };
  };

  const salesMetrics = calculateSalesMetrics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ products: true, sales: true });
        const token = localStorage.getItem("token");
        const today = moment().startOf('day').toISOString();
        
        const [productsRes, salesRes] = await Promise.all([
          axios.get("http://localhost:5001/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5001/sales?startDate=${today}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        
        setProducts(productsRes.data);
        setTodaySales(salesRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading({ products: false, sales: false });
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading.products && !loading.sales) {
      updateSalesData(todaySales);
    }
  }, [products, todaySales, loading]);
  // Place this right next to your existing useEffects
useEffect(() => {
  const collegeId = saleData.collegeId.trim();

  // 1. Clear previous errors if the field is empty or set to the default "N/A"
  if (!collegeId || collegeId === "N/A") {
    setCollegeIdError(null);
    return;
  }
  
  // 2. Set a timer (debounce) to wait for the user to finish typing
  const handler = setTimeout(async () => {
    
    // 3. Start the check
    setIsCheckingId(true);
    setCollegeIdError(null); // Clear previous errors before checking

    try {
      const token = localStorage.getItem("token");
      
      // 🚨 IMPLEMENT THIS NEW BACKEND ENDPOINT
      // This API call hits your server to check if the ID exists in your customer/sales database.
      const response = await axios.get(`http://localhost:5001/sales/check-college-id?id=${encodeURIComponent(collegeId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Assuming your backend returns { exists: true } if found
      if (response.data.exists) {
        setCollegeIdError(`⚠️ College ID "${collegeId}" already exists!`);
      } else {
        setCollegeIdError(null);
      }
      
    } catch (err) {
      console.error("Error checking College ID:", err);
      // You can set a generic error message if the API call fails
      setCollegeIdError("Could not verify College ID. Check console for details.");
    } finally {
      setIsCheckingId(false);
    }
  }, 500); // 500ms debounce time

  // Cleanup function: Clear the timer if collegeId changes before the timeout
  return () => {
    clearTimeout(handler);
  };
  
}, [saleData.collegeId]); // Dependency array: run only when collegeId changes
  const updateSalesData = (sales) => {
    if (!sales || sales.length === 0 || products.length === 0) {
      setGraphData({ top: [], bottom: [] });
      return;
    }
  
    const productSalesMap = {};
    
    sales.forEach(sale => {
      if (!sale.items || !Array.isArray(sale.items)) return;
      
      sale.items.forEach(item => {
        const productId = item.productId?._id || item.productId;
        if (!productId || !item.quantitySold) return;
        
        if (!productSalesMap[productId]) {
          const product = products.find(p => p._id === productId);
          productSalesMap[productId] = {
            productId: productId,
            name: product ? product.name : `Product ${productId}`,
            quantitySold: 0
          };
        }
        productSalesMap[productId].quantitySold += item.quantitySold;
      });
    });
  
    const productSalesArray = Object.values(productSalesMap);
    
    if (productSalesArray.length > 0) {
      const sortedProducts = productSalesArray.sort((a, b) => b.quantitySold - a.quantitySold);
      
      setGraphData({
        top: sortedProducts.slice(0, Math.min(5, sortedProducts.length)),
        bottom: sortedProducts.slice(-5).reverse(),
      });
    } else {
      setGraphData({ top: [], bottom: [] });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleData({ ...saleData, [name]: value });
  };

  const addProductToSale = (product) => {
    setSaleData(prevData => {
      const existingItemIndex = prevData.items.findIndex(
        item => item.productId === product._id
      );
      
      if (existingItemIndex >= 0) {
        // Create new array with updated quantity (+1)
        const updatedItems = [...prevData.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantitySold: parseFloat((updatedItems[existingItemIndex].quantitySold + 1).toFixed(2))
        };
        return { ...prevData, items: updatedItems };
      } else {
        // Add new product with quantity 1
        const newItems = [
          ...prevData.items,
          { 
            productId: product._id, 
            quantitySold: 1,
            price: product.price // Store price for quick reference
          }
        ];
        return { ...prevData, items: newItems };
      }
    });
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 0.01) return;
    
    const updatedItems = [...saleData.items];
    updatedItems[index].quantitySold = parseFloat(newQuantity.toFixed(2));
    setSaleData({ ...saleData, items: updatedItems });
  };

  const removeItem = (index) => {
    const updatedItems = [...saleData.items];
    updatedItems.splice(index, 1);
    setSaleData({ ...saleData, items: updatedItems });
  };

  const calculateTotal = () => {
    return saleData.items.reduce((total, item) => {
      const product = products.find(p => p._id === item.productId);
      if (!product) return total;
      return total + (product.price * item.quantitySold);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5001/sales", saleData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
      
      setSaleData({
        items: [],
        customerName: "Walk-in Customer",
        collegeId: "N/A",
        customerContact: "",
        customerEmail: "",
        paymentType: "",
      });
      setCashAmount("");
      setChangeToReturn(0);
      
      const today = moment().startOf('day').toISOString();
      const res = await axios.get(`http://localhost:5001/sales?startDate=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodaySales(res.data);
    } catch (err) {
      console.error("Error logging sale:", err.response?.data || err.message);
      alert("Failed to log sale. Please check your inputs.");
    }
  };

  const handlePaymentMethod = (method) => {
    setSaleData({ ...saleData, paymentType: method });
    setSelectedPayment(method);
    setShowCashInput(method === "Cash");
  };

  const handleCashAmountChange = (e) => {
    const amount = parseFloat(e.target.value);
    setCashAmount(amount);
    const totalAmount = calculateTotal();
    setChangeToReturn(amount - totalAmount);
  };

  const QuantitySelector = ({ item, index }) => {
    const [localQuantity, setLocalQuantity] = useState(item.quantitySold);
    const [isEditing, setIsEditing] = useState(false);

    const handleBlur = () => {
      const newQuantity = parseFloat(localQuantity);
      if (!isNaN(newQuantity)) {
        updateItemQuantity(index, newQuantity);
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleBlur();
      }
    };

    const quickAdjust = (amount) => {
      const newValue = parseFloat((localQuantity + amount).toFixed(2));
      setLocalQuantity(newValue);
      updateItemQuantity(index, newValue);
    };

    return (
      <div className="flex items-center">
        <button 
          onClick={() => quickAdjust(-0.25)}
          className="bg-gray-600 text-white w-8 h-8 rounded-l flex items-center justify-center hover:bg-gray-500 transition-colors"
        >
          -
        </button>
        
        {isEditing ? (
          <input
            type="number"
            value={localQuantity}
            onChange={(e) => setLocalQuantity(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-gray-700 text-white w-12 h-8 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
            step="0.01"
            min="0.01"
            autoFocus
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="bg-gray-700 text-white w-12 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
          >
            {localQuantity}
          </div>
        )}
        
        <button 
          onClick={() => quickAdjust(0.25)}
          className="bg-gray-600 text-white w-8 h-8 rounded-r flex items-center justify-center hover:bg-gray-500 transition-colors"
        >
          +
        </button>
      </div>
    );
  };

  const renderCartItem = (item, index) => {
    const product = products.find(p => p._id === item.productId);
    if (!product) return null;
    
    return (
      <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{product.name}</p>
          <p className="text-sm text-gray-300">${product.price.toFixed(2)} each</p>
        </div>
        
        <QuantitySelector item={item} index={index} />
        
        <div className="ml-4 text-right w-20">
          <p className="font-semibold text-white">
            ${(product.price * item.quantitySold).toFixed(2)}
          </p>
        </div>
        
        <button 
          onClick={() => removeItem(index)}
          className="ml-2 text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center transition-colors"
          aria-label="Remove item"
        >
          ×
        </button>
      </div>
    );
  };

  const renderGraph = () => {
    if (loading.products || loading.sales) {
      return <div className="animate-pulse bg-gray-700 h-64 rounded-lg"></div>;
    }

    if (graphData.top.length === 0 && graphData.bottom.length === 0) {
      return <p className="text-gray-400 text-center py-8">No sales data available for today</p>;
    }

    const createChartData = (data, label) => {
      const labels = data.map(item => item.name || `Product ${item.productId}`);
      
      return {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data.map(item => item.quantitySold),
            backgroundColor: label.includes('Top') ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)',
            borderColor: label.includes('Top') ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
            borderWidth: 1,
            tension: 0.1,
          },
        ],
      };
    };

    return (
      <div className="mt-6 space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Today's Top 5 Sold Products</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <Line
              data={createChartData(graphData.top, "Top Sellers")}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: 'white'
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: 'white'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    }
                  },
                  x: {
                    ticks: {
                      color: 'white'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Today's Bottom 5 Sold Products</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <Line
              data={createChartData(graphData.bottom, "Bottom Sellers")}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: 'white'
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: 'white'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    }
                  },
                  x: {
                    ticks: {
                      color: 'white'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* POS System Layout */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left Side - Product Selection */}
        <div className="lg:w-2/3">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Products</h2>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            {loading.products ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg h-32 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <button
                    key={product._id}
                    onClick={() => addProductToSale(product)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-all flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-indigo-500 rounded-full mb-2 flex items-center justify-center text-white font-bold">
                      {product.name.charAt(0)}
                    </div>
                    <h3 className="text-white font-medium text-center truncate w-full">{product.name}</h3>
                    <p className="text-green-400 mt-1">${product.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Customer Information */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-1">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={saleData.customerName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
      <label className="block text-gray-300 mb-1">College ID</label>
      <div className="relative"> {/* Use a relative container for absolute positioning */}
        <input
          type="text"
          name="collegeId"
          className={`w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-1 
            ${collegeIdError ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-indigo-500'}`} // Style border on error
          value={saleData.collegeId}
          onChange={handleInputChange}
        />
        {isCheckingId && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {/* Simple spinner */}
            <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      {collegeIdError && (
        <p className="text-red-400 text-sm mt-1">{collegeIdError}</p>
      )}
      </div>
              <div>
                <label className="block text-gray-300 mb-1">Contact Number</label>
                <input
                  type="text"
                  name="customerContact"
                  placeholder="Contact Number"
                  className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={saleData.customerContact}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  name="customerEmail"
                  placeholder="Email"
                  className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={saleData.customerEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Cart/Receipt */}
        <div className="lg:w-1/3">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl sticky top-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Current Sale</h2>
              {successMessage && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                  Sale Completed!
                </span>
              )}
            </div>
            
            {/* Cart Items */}
            <div className="max-h-96 overflow-y-auto mb-4">
              {saleData.items.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No products added</p>
              ) : (
                <div className="space-y-3">
                  {saleData.items.map((item, index) => renderCartItem(item, index))}
                </div>
              )}
            </div>
            
            {/* Total */}
            <div className="border-t border-gray-600 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-white">${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-green-400">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Options */}
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePaymentMethod("Cash")}
                  className={`py-3 px-4 rounded-lg transition ${selectedPayment === "Cash" 
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-400" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                >
                  Cash
                </button>
                <button
                  onClick={() => handlePaymentMethod("Card")}
                  className={`py-3 px-4 rounded-lg transition ${selectedPayment === "Card" 
                    ? "bg-green-600 text-white ring-2 ring-green-400" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                >
                  Card
                </button>
              </div>
              
              {showCashInput && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <label className="block text-gray-300 mb-2">Amount Received</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={handleCashAmountChange}
                    className="w-full p-3 bg-gray-800 text-white rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter amount"
                    min={calculateTotal()}
                    step="0.01"
                  />
                  {changeToReturn > 0 && (
                    <p className="mt-2 text-right text-green-400">
                      Change: ${changeToReturn.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={saleData.items.length === 0 || !saleData.paymentType}
                className={`w-full py-3 px-4 rounded-lg font-bold transition ${saleData.items.length === 0 || !saleData.paymentType
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Section */}
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mx-auto mt-8 max-w-7xl">
        <h2 className="text-2xl font-bold text-white mb-6">Today's Sales Analytics</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-indigo-900 p-6 rounded-lg text-center hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-white">
              ${salesMetrics.totalRevenue}
            </p>
          </div>

          <div className="bg-green-900 p-6 rounded-lg text-center hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-white">
              {salesMetrics.totalSales}
            </p>
          </div>

          <div className="bg-purple-900 p-6 rounded-lg text-center hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Average Sale</h3>
            <p className="text-3xl font-bold text-white">
              ${salesMetrics.averageSale}
            </p>
          </div>
        </div>
        
        {/* Graphs */}
        {renderGraph()}
        
        {/* Top/Bottom Sellers */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Top Selling Products</h3>
            {graphData.top.length > 0 ? (
              <ul className="space-y-2">
                {graphData.top.map((product, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-white truncate">
                      {product.name || `Product ${product.productId}`}
                    </span>
                    <span className="text-green-400 font-medium">
                      {product.quantitySold} sold
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No sales data available for today</p>
            )}
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Least Selling Products</h3>
            {graphData.bottom.length > 0 ? (
              <ul className="space-y-2">
                {graphData.bottom.map((product, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-white truncate">
                      {product.name || `Product ${product.productId}`}
                    </span>
                    <span className="text-red-400 font-medium">
                      {product.quantitySold} sold
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No sales data available for today</p>
            )}  
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogSalePage;