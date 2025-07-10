import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AuthGuard = ({ children, requiredRole = null }) => {
  const { user, loading } = useUser();

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = user.user_metadata?.role?.toLowerCase();

    // If user has no role, redirect to login
    if (!userRole) {
      return <Navigate to="/login" replace />;
    }

    if (userRole !== requiredRole.toLowerCase()) {
      // Redirect based on user role
      if (userRole === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (userRole === "student") {
        return <Navigate to="/student/dashboard" replace />;
      } else if (userRole === "teacher") {
        return <Navigate to="/teacher/dashboard" replace />;
      }
      // If role doesn't match any expected role, redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default AuthGuard;
