import React from "react";
import { Outlet } from "react-router-dom";
import TeacherHeader from "../Components/TeacherDashboard/TeacherHeader";
import TeacherSidebar from "../Components/TeacherDashboard/TeacherSidebar";

const TeacherDashboardLayout = () => {
  return (
    <>
      <TeacherSidebar />
      <TeacherHeader />
      <main className="pt-24 px-6 bg-gray-100 min-h-screen ml-64">
        <Outlet />
      </main>
    </>
  );
};

export default TeacherDashboardLayout;
