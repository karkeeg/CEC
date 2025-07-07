import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LayoutPage from "./Pages/LayoutPage";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import DashboardCard from "./Components/StudentDashboard/DashboardCards";
import Assignment from "./Components/StudentDashboard/Assignments";
import AdminLayout from "./Pages/AdminLayout";
import Classes from "./Components/StudentDashboard/Classes";
import Attendance from "./Components/StudentDashboard/Attendance";

const MyRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutPage />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardCard />} />
          <Route path="/assignment" element={<Assignment />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/attendance" element={<Attendance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default MyRoutes;
