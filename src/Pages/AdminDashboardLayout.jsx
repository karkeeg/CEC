import { Outlet } from "react-router-dom";
import AdminSidebar from "../Components/AdminDashboard.jsx/AdminSidebar";
import AdminHeader from "../Components/AdminDashboard.jsx/AdminHeader";
import React, { useState } from "react";

const AdminDasboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <AdminHeader onHamburgerClick={() => setSidebarOpen(true)} />
      <main className="pt-[86px] px-1 md:px-2 bg-gray-100 min-h-screen transition-all duration-300 md:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDasboardLayout;
