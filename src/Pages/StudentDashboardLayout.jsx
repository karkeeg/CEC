import React, { useState } from "react";
import Sidebar from "../Components/StudentDashboard/Sidebar";
import { Outlet } from "react-router-dom";
import Header from "../Components/StudentDashboard/Header";

const StudentDasboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Header onHamburgerClick={() => setSidebarOpen(true)} />
      <main
        className={`pt-24 px-6 bg-gray-100 min-h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        } md:ml-64`}
      >
        <Outlet />
      </main>
    </>
  );
};

export default StudentDasboardLayout;
