import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AuthGuard = ({ children, requiredRole = null }) => {
  const { user, role, loading } = useUser();
  // Debug logging
  console.log("AuthGuard user:", user);
  console.log("AuthGuard role:", role);
  console.log("AuthGuard loading:", loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    // Redirect based on user role
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AuthGuard;
