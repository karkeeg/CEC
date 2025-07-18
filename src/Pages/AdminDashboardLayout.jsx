import { Outlet } from "react-router-dom";
import AdminSidebar from "../Components/AdminDashboard.jsx/AdminSidebar";
import AdminHeader from "../Components/AdminDashboard.jsx/AdminHeader";
import React, { useState } from "react";

const AdminDasboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <AdminHeader onHamburgerClick={() => setSidebarOpen(true)} />
      <main
        className={`pt-24 px-4 md:px-6 bg-gray-100 min-h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        } md:ml-64`}
      >
        <Outlet />
      </main>
    </>
  );
};

export default AdminDasboardLayout;
