import React, { useState } from "react";
import Sidebar from "../Components/StudentDashboard/Sidebar";
import { Outlet } from "react-router-dom";
import Header from "../Components/StudentDashboard/Header";

const StudentDasboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Header onHamburgerClick={() => setSidebarOpen(true)} />
      <main className="pt-[80px] px-6 bg-gray-100 min-h-screen transition-all duration-300 md:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentDasboardLayout;
