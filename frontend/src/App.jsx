import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ProductManagementPage from "./pages/ProductManagementPage";
import EmployeeManagementPage from "./pages/EmployeeManagentPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import LogSalePage from "./pages/LogSalePage";
import EmployeeSalesHistoryPage from "./pages/EmployeeSalesHistoryPage";
import ProtectedRoute from "./utils/ProtectedRoutes";

function App() {
  const navigate = useNavigate();

  // Logout Function
  const handleLogout = () => {
    // Clear user session from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // Redirect to login page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Logout Button */}
      <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
        {/* App Title */}
        <h1 className="text-2xl font-bold">Student Store</h1>

        {/* Logout Button */}
        {localStorage.getItem("token") && (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-300"
          >
            Logout
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="p-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ProductManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmployeeManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SalesHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/sales"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <LogSalePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/sales-history"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeSalesHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect to Login for Unknown Routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;