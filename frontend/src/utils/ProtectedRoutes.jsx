import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  const loginPath = "/"; 

  if (location.pathname === loginPath && role) {
    return <Navigate to={`/${role}`} />;
  }
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={loginPath} />;
  }

  return children;
};

export default ProtectedRoute;