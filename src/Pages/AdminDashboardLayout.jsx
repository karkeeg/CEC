import { Outlet } from "react-router-dom";
import AdminSidebar from "../Components/AdminDashboard.jsx/AdminSidebar";
import AdminHeader from "../Components/AdminDashboard.jsx/AdminHeader";

const AdminDasboardLayout = () => {
  return (
    <>
      <AdminSidebar />
      <AdminHeader />
      <main className=" pt-24 px-6 bg-gray-100 min-h-screen">
        <Outlet />
      </main>
    </>
  );
};

export default AdminDasboardLayout;
