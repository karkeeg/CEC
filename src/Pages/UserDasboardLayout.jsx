import React from "react";
import Sidebar from "../Components/StudentDashboard/Sidebar";
import { Outlet } from "react-router-dom";
import Header from "../Components/StudentDashboard/Header";

const UserDasboardLayout = () => {
  return (
    <>
      <Sidebar />
      <Header />
      <main className=" pt-24 px-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>
    </>
  );
};

export default UserDasboardLayout;
