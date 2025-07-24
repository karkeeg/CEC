import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LayoutPage from "./Pages/LayoutPage";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import DashboardCard from "./Components/StudentDashboard/DashboardCards";
import Assignment from "./Components/StudentDashboard/Assignments";
// import AdminLayout from "./Pages/UserDasboardLayout";
import Classes from "./Components/StudentDashboard/Classes";
import Attendance from "./Components/StudentDashboard/Attendance";
import StudentList from "./Components/StudentList";
import Register from "./Pages/RegisterPage";
import UserDasboardLayout from "./Pages/StudentDashboardLayout";
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
import Articles from "./Pages/Articles";
import ArticleDetail from "./Pages/ArticleDetail";
import AdminAnalytics from "./Components/AdminDashboard.jsx/AdminAnalytics";
import Settings from "./Components/Settings";
import StudentAnalytics from "./Components/StudentDashboard/StudentAnalytics";
import DepartmentDetail from "./Pages/DepartmentDetail";
import Gallery from "./Pages/Gallery";
import Notices from "./Pages/Notices";
import NoticeDetail from "./Pages/NoticeDetail";
import DownloadPage from "./Pages/DownloadPage";
import AdministrationPage from "./Pages/AdministrationPage";

// Teacher Dashboard Components
import TeacherDashboardLayout from "./Pages/TeacherDashboardLayout";
import TeacherMainDashboard from "./Components/TeacherDashboard/TeacherMainDashboard";
import TeacherStudents from "./Components/TeacherDashboard/TeacherStudents";
import TeacherClasses from "./Components/TeacherDashboard/TeacherClasses";
import TeacherAssignments from "./Components/TeacherDashboard/TeacherAssignments";
import TeacherAttendance from "./Components/TeacherDashboard/TeacherAttendance";
import TeacherGrades from "./Components/TeacherDashboard/TeacherGrades";
import TeacherAnalytics from "./Components/TeacherDashboard/TeacherAnalytics";
import TeacherSettings from "./Components/TeacherDashboard/TeacherSettings";
import StudentDasboardLayout from "./Pages/StudentDashboardLayout";

const MyRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutPage />}>
          <Route index element={<HomePage />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/department/:id" element={<DepartmentDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/notices/:id" element={<NoticeDetail />} />
          <Route path="/downloads/:id" element={<DownloadPage />} />
          <Route
            path="/staff/administration"
            element={<AdministrationPage />}
          />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/st" element={<StudentList />} />

        {/* Student Routes - Protected */}
        <Route
          path="/student"
          element={
            <AuthGuard requiredRole="student">
              <StudentDasboardLayout />
            </AuthGuard>
          }
        >
          <Route path="dashboard" element={<DashboardCard />} />
          <Route path="assignment" element={<Assignment />} />
          <Route path="classes" element={<Classes />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="settings" element={<Settings />} />
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

          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Teacher Routes - Protected */}
        <Route
          path="/teacher"
          element={
            <AuthGuard requiredRole="teacher">
              <TeacherDashboardLayout />
            </AuthGuard>
          }
        >
          <Route path="dashboard" element={<TeacherMainDashboard />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="grades" element={<TeacherGrades />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="settings" element={<TeacherSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default MyRoutes;
