import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js/auto';
import moment from 'moment';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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
    discountApplied: 0,
    discountType: "percentage"
  });
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [changeToReturn, setChangeToReturn] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [graphData, setGraphData] = useState({ top: [], bottom: [], hourly: [], weekly: [] });
  const [loading, setLoading] = useState({
    products: false,
    sales: false
  });
  const [successMessage, setSuccessMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("daily");

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to round to 2 decimals
  const roundToTwo = (num) => {
    return parseFloat((Math.round(num * 100) / 100).toFixed(2));
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return roundToTwo(saleData.items.reduce((total, item) => {
      const product = products.find(p => p._id === item.productId);
      if (!product) return total;
      return total + (product.price * item.quantitySold);
    }, 0));
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (saleData.discountType === "percentage") {
      return roundToTwo(subtotal * (saleData.discountApplied / 100));
    } else {
      return Math.min(saleData.discountApplied, subtotal);
    }
  };

  // Calculate total after discount
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return roundToTwo(subtotal - discountAmount);
  };

  // Apply 10% discount
  const applyTenPercentDiscount = () => {
    setSaleData(prev => ({
      ...prev,
      discountApplied: 10,
      discountType: "percentage"
    }));
  };

  // Remove discount
  const removeDiscount = () => {
    setSaleData(prev => ({
      ...prev,
      discountApplied: 0
    }));
  };

  // Calculate sales metrics with discount consideration
  const calculateSalesMetrics = () => {
    if (!todaySales.length || !products.length) return { totalRevenue: 0, totalSales: 0, averageSale: 0, totalDiscount: 0 };

    let totalRevenue = 0;
    let totalDiscount = 0;

    todaySales.forEach(sale => {
      const saleTotal = sale.items.reduce((sum, item) => {
        const product = products.find(p => p._id === (item.productId?._id || item.productId));
        return sum + (product?.price || 0) * (item.quantitySold || 0);
      }, 0);
      
      const discountAmount = sale.discountApplied ? 
        (sale.discountType === "percentage" ? saleTotal * (sale.discountApplied / 100) : sale.discountApplied) : 0;
      
      totalRevenue += saleTotal - discountAmount;
      totalDiscount += discountAmount;
    });

    const totalSales = todaySales.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue: roundToTwo(totalRevenue),
      totalSales,
      averageSale: roundToTwo(averageSale),
      totalDiscount: roundToTwo(totalDiscount)
    };
  };

  const salesMetrics = calculateSalesMetrics();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading({ products: true, sales: true });
        const token = localStorage.getItem("token");
        
        let startDate, endDate;
        const now = moment();
        
        if (selectedTimeframe === "daily") {
          startDate = now.startOf('day').toISOString();
          endDate = now.endOf('day').toISOString();
        } else if (selectedTimeframe === "weekly") {
          startDate = now.startOf('week').toISOString();
          endDate = now.endOf('week').toISOString();
        } else {
          startDate = now.startOf('month').toISOString();
          endDate = now.endOf('month').toISOString();
        }
        
        const [productsRes, salesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/products`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/sales?startDate=${startDate}&endDate=${endDate}`, {
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
  }, [selectedTimeframe]);

  // Update sales data for graphs
  useEffect(() => {
    if (!loading.products && !loading.sales && products.length > 0) {
      updateSalesData(todaySales);
    }
  }, [products, todaySales, loading]);

  const updateSalesData = (sales) => {
    if (!sales || sales.length === 0 || products.length === 0) {
      setGraphData({ top: [], bottom: [], hourly: [], weekly: [] });
      return;
    }
  
    // Product sales map
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
            quantitySold: 0,
            revenue: 0
          };
        }
        const product = products.find(p => p._id === productId);
        const itemRevenue = (product?.price || 0) * item.quantitySold;
        productSalesMap[productId].quantitySold += item.quantitySold;
        productSalesMap[productId].revenue += itemRevenue;
      });
    });
  
    const productSalesArray = Object.values(productSalesMap);
    
    if (productSalesArray.length > 0) {
      const sortedByQuantity = [...productSalesArray].sort((a, b) => b.quantitySold - a.quantitySold);
      const sortedByRevenue = [...productSalesArray].sort((a, b) => b.revenue - a.revenue);
      
      setGraphData({
        top: sortedByQuantity.slice(0, 5),
        bottom: sortedByQuantity.slice(-5).reverse(),
        topByRevenue: sortedByRevenue.slice(0, 5),
        hourly: generateHourlyData(sales),
        weekly: generateWeeklyData(sales)
      });
    } else {
      setGraphData({ top: [], bottom: [], topByRevenue: [], hourly: [], weekly: [] });
    }
  };

  const generateHourlyData = (sales) => {
    const hourlyMap = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = { sales: 0, revenue: 0 };
    }
    
    sales.forEach(sale => {
      const hour = moment(sale.createdAt).hour();
      const saleRevenue = sale.items.reduce((sum, item) => {
        const product = products.find(p => p._id === (item.productId?._id || item.productId));
        return sum + (product?.price || 0) * (item.quantitySold || 0);
      }, 0);
      
      hourlyMap[hour].sales += 1;
      hourlyMap[hour].revenue += saleRevenue;
    });
    
    return {
      hours: Object.keys(hourlyMap).map(h => `${h}:00`),
      sales: Object.values(hourlyMap).map(h => h.sales),
      revenue: Object.values(hourlyMap).map(h => roundToTwo(h.revenue))
    };
  };

  const generateWeeklyData = (sales) => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayMap = {};
    weekdays.forEach(day => {
      weekdayMap[day] = { sales: 0, revenue: 0 };
    });
    
    sales.forEach(sale => {
      const weekday = weekdays[moment(sale.createdAt).day()];
      const saleRevenue = sale.items.reduce((sum, item) => {
        const product = products.find(p => p._id === (item.productId?._id || item.productId));
        return sum + (product?.price || 0) * (item.quantitySold || 0);
      }, 0);
      
      weekdayMap[weekday].sales += 1;
      weekdayMap[weekday].revenue += saleRevenue;
    });
    
    return {
      days: weekdays,
      sales: weekdays.map(day => weekdayMap[day].sales),
      revenue: weekdays.map(day => roundToTwo(weekdayMap[day].revenue))
    };
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
        const updatedItems = [...prevData.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantitySold: parseFloat((updatedItems[existingItemIndex].quantitySold + 1).toFixed(2))
        };
        return { ...prevData, items: updatedItems };
      } else {
        const newItems = [
          ...prevData.items,
          { 
            productId: product._id, 
            quantitySold: 1,
            price: product.price
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      
      const saleDataToSend = {
        items: saleData.items,
        customerName: saleData.customerName,
        collegeId: saleData.collegeId,
        customerContact: saleData.customerContact,
        customerEmail: saleData.customerEmail,
        paymentType: saleData.paymentType,
        discountApplied: saleData.discountApplied,
        discountType: saleData.discountType,
        subtotal: calculateSubtotal(),
        totalAmount: calculateTotal()
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/sales`, saleDataToSend, {
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
        discountApplied: 0,
        discountType: "percentage"
      });
      setCashAmount("");
      setChangeToReturn(0);
      setSelectedPayment("");
      setShowCashInput(false);
      
      // Refresh data
      const today = moment().startOf('day').toISOString();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/sales?startDate=${today}`, {
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
    setChangeToReturn(roundToTwo(amount - totalAmount));
  };

  // Quantity Selector Component
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

    const quickAdjust = (amount) => {
      const newValue = parseFloat((localQuantity + amount).toFixed(2));
      setLocalQuantity(newValue);
      updateItemQuantity(index, newValue);
    };

    return (
      <div className="flex items-center">
        <button onClick={() => quickAdjust(-0.25)} className="bg-gray-600 text-white w-8 h-8 rounded-l flex items-center justify-center hover:bg-gray-500">-</button>
        {isEditing ? (
          <input type="number" value={localQuantity} onChange={(e) => setLocalQuantity(e.target.value)} onBlur={handleBlur} className="bg-gray-700 text-white w-12 h-8 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" step="0.01" min="0.01" autoFocus />
        ) : (
          <div onClick={() => setIsEditing(true)} className="bg-gray-700 text-white w-12 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-600">{localQuantity}</div>
        )}
        <button onClick={() => quickAdjust(0.25)} className="bg-gray-600 text-white w-8 h-8 rounded-r flex items-center justify-center hover:bg-gray-500">+</button>
      </div>
    );
  };

  const renderCartItem = (item, index) => {
    const product = products.find(p => p._id === item.productId);
    if (!product) return null;
    
    return (
      <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg hover:bg-gray-600">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{product.name}</p>
          <p className="text-sm text-gray-300">${product.price.toFixed(2)} each</p>
        </div>
        <QuantitySelector item={item} index={index} />
        <div className="ml-4 text-right w-20">
          <p className="font-semibold text-white">${(product.price * item.quantitySold).toFixed(2)}</p>
        </div>
        <button onClick={() => removeItem(index)} className="ml-2 text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center">×</button>
      </div>
    );
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Timeframe Selector */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-end">
        <div className="bg-gray-800 rounded-lg p-2 flex gap-2">
          <button onClick={() => setSelectedTimeframe("daily")} className={`px-4 py-2 rounded ${selectedTimeframe === "daily" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300"}`}>Daily</button>
          <button onClick={() => setSelectedTimeframe("weekly")} className={`px-4 py-2 rounded ${selectedTimeframe === "weekly" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300"}`}>Weekly</button>
          <button onClick={() => setSelectedTimeframe("monthly")} className={`px-4 py-2 rounded ${selectedTimeframe === "monthly" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300"}`}>Monthly</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left Side - Product Selection */}
        <div className="lg:w-2/3">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Products</h2>
            <div className="relative mb-6">
              <input type="text" placeholder="Search products..." className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            {loading.products ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-700 rounded-lg h-32 animate-pulse"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <button key={product._id} onClick={() => addProductToSale(product)} className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-all flex flex-col items-center">
                    <div className="w-16 h-16 bg-indigo-500 rounded-full mb-2 flex items-center justify-center text-white font-bold">{product.name.charAt(0)}</div>
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
              <div><label className="block text-gray-300 mb-1">Customer Name</label><input type="text" name="customerName" className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" value={saleData.customerName} onChange={handleInputChange} /></div>
              <div><label className="block text-gray-300 mb-1">College ID</label><input type="text" name="collegeId" className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" value={saleData.collegeId} onChange={handleInputChange} /></div>
              <div><label className="block text-gray-300 mb-1">Contact Number</label><input type="text" name="customerContact" placeholder="Contact Number" className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={saleData.customerContact} onChange={handleInputChange} /></div>
              <div><label className="block text-gray-300 mb-1">Email (Optional)</label><input type="email" name="customerEmail" placeholder="Email" className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={saleData.customerEmail} onChange={handleInputChange} /></div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Cart/Receipt */}
        <div className="lg:w-1/3">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl sticky top-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Current Sale</h2>
              {successMessage && <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">Sale Completed!</span>}
            </div>
            
            <div className="max-h-96 overflow-y-auto mb-4">
              {saleData.items.length === 0 ? <p className="text-gray-400 text-center py-8">No products added</p> : <div className="space-y-3">{saleData.items.map((item, index) => renderCartItem(item, index))}</div>}
            </div>
            
            {/* Discount Section with Simple 10% Button */}
            <div className="border-t border-gray-600 pt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              
              {/* 10% Discount Button */}
              <div className="mb-4">
                {saleData.discountApplied === 0 ? (
                  <button
                    onClick={applyTenPercentDiscount}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <span>🎯</span> Apply 10% Discount
                  </button>
                ) : (
                  <div className="bg-green-900/30 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-green-400 font-semibold">10% Discount Applied!</span>
                        <p className="text-sm text-gray-300 mt-1">Discount: -${discountAmount.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-600">
                <span className="text-white">Total</span>
                <span className="text-green-400 text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Options */}
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handlePaymentMethod("Cash")} className={`py-3 px-4 rounded-lg transition ${selectedPayment === "Cash" ? "bg-indigo-600 text-white ring-2 ring-indigo-400" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>Cash</button>
                <button onClick={() => handlePaymentMethod("Card")} className={`py-3 px-4 rounded-lg transition ${selectedPayment === "Card" ? "bg-green-600 text-white ring-2 ring-green-400" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>Card</button>
              </div>
              
              {showCashInput && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <label className="block text-gray-300 mb-2">Amount Received</label>
                  <input type="number" value={cashAmount} onChange={handleCashAmountChange} className="w-full p-3 bg-gray-800 text-white rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Enter amount" min={total} step="0.01" />
                  {changeToReturn > 0 && <p className="mt-2 text-right text-green-400">Change: ${changeToReturn.toFixed(2)}</p>}
                </div>
              )}
              
              <button onClick={handleSubmit} disabled={saleData.items.length === 0 || !saleData.paymentType} className={`w-full py-3 px-4 rounded-lg font-bold transition ${saleData.items.length === 0 || !saleData.paymentType ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}>Complete Sale</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Section with Enhanced Graphs */}
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mx-auto mt-8 max-w-7xl">
        <h2 className="text-2xl font-bold text-white mb-6">Sales Analytics ({selectedTimeframe === "daily" ? "Today" : selectedTimeframe === "weekly" ? "This Week" : "This Month"})</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-indigo-900 p-6 rounded-lg text-center hover:scale-105 transition-transform"><h3 className="text-lg font-semibold text-white mb-2">Total Revenue</h3><p className="text-3xl font-bold text-white">${salesMetrics.totalRevenue}</p></div>
          <div className="bg-green-900 p-6 rounded-lg text-center hover:scale-105 transition-transform"><h3 className="text-lg font-semibold text-white mb-2">Total Sales</h3><p className="text-3xl font-bold text-white">{salesMetrics.totalSales}</p></div>
          <div className="bg-purple-900 p-6 rounded-lg text-center hover:scale-105 transition-transform"><h3 className="text-lg font-semibold text-white mb-2">Average Sale</h3><p className="text-3xl font-bold text-white">${salesMetrics.averageSale}</p></div>
          <div className="bg-orange-900 p-6 rounded-lg text-center hover:scale-105 transition-transform"><h3 className="text-lg font-semibold text-white mb-2">Total Discounts</h3><p className="text-3xl font-bold text-white">${salesMetrics.totalDiscount}</p></div>
        </div>
        
        {/* Hourly Sales Trend */}
        {graphData.hourly && graphData.hourly.hours && graphData.hourly.hours.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Hourly Sales Trend</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <Bar data={{ labels: graphData.hourly.hours, datasets: [{ label: "Number of Sales", data: graphData.hourly.sales, backgroundColor: "rgba(75, 192, 192, 0.5)", borderColor: "rgb(75, 192, 192)", borderWidth: 1 }] }} options={{ responsive: true, plugins: { legend: { labels: { color: "white" } } }, scales: { y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } }, x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } } } }} />
            </div>
          </div>
        )}
        
        {/* Top Products */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Top Selling Products</h3>
            {graphData.top && graphData.top.length > 0 ? (
              <ul className="space-y-2">
                {graphData.top.map((product, index) => (<li key={index} className="flex justify-between items-center"><span className="text-white truncate">{product.name}</span><span className="text-green-400 font-medium">{product.quantitySold} sold</span></li>))}
              </ul>
            ) : (<p className="text-gray-400">No sales data available</p>)}
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Top by Revenue</h3>
            {graphData.topByRevenue && graphData.topByRevenue.length > 0 ? (
              <ul className="space-y-2">
                {graphData.topByRevenue.map((product, index) => (<li key={index} className="flex justify-between items-center"><span className="text-white truncate">{product.name}</span><span className="text-green-400 font-medium">${product.revenue.toFixed(2)}</span></li>))}
              </ul>
            ) : (<p className="text-gray-400">No revenue data available</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogSalePage;
