import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LayoutPage from "./Pages/LayoutPage";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import DashboardCard from "./Components/StudentDashboard/DashboardCards";
import Assignment from "./Components/StudentDashboard/Assignments";
import AdminLayout from "./Pages/UserDasboardLayout";
import Classes from "./Components/StudentDashboard/Classes";
import Attendance from "./Components/StudentDashboard/Attendance";
import StudentList from "./Components/StudentList";
import Register from "./Pages/RegisterPage";
import UserDasboardLayout from "./Pages/UserDasboardLayout";
import AdminDasboardLayout from "./Pages/AdminDashboardLayout";
import AdminStudents from "./Components/AdminDashboard.jsx/AdminStudents";
import TeacherDashboard from "./Components/AdminDashboard.jsx/TeacherDashboard";
import DepartmentsPage from "./Components/AdminDashboard.jsx/DeparmentsPage";
import AdminAttandancePage from "./Components/AdminDashboard.jsx/AdminAttandencePage";
import AdminAssignmentsPage from "./Components/AdminDashboard.jsx/AdminAssignments";
import MainDashboard from "./Components/AdminDashboard.jsx/MainDashboard";
import AnalyticsDashboard from "./Components/AdminDashboard.jsx/AnalyticsDashboard";
import FeeDashboard from "./Components/AdminDashboard.jsx/FeeDashboard";
import Feedback from "./Components/StudentDashboard/Feedback";
import AuthGuard from "../src/Components/AuthGuard";

const MyRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutPage />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes - Protected */}
        <Route
          path="/student"
          element={
            <AuthGuard requiredRole="student">
              <UserDasboardLayout />
            </AuthGuard>
          }
        >
          <Route path="dashboard" element={<DashboardCard />} />
          <Route path="assignment" element={<Assignment />} />
          <Route path="classes" element={<Classes />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>

        {/* Admin Routes - Protected */}
        <Route
          path="/admin"
          element={
            <AuthGuard requiredRole="admin">
              <AdminDasboardLayout />
            </AuthGuard>
          }
        >
          <Route path="dashboard" element={<MainDashboard />} />
          <Route path="student" element={<AdminStudents />} />
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="department" element={<DepartmentsPage />} />
          <Route path="attendance" element={<AdminAttandancePage />} />
          <Route path="assignment" element={<AdminAssignmentsPage />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="fee" element={<FeeDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default MyRoutes;
