import React from "react";
import { CgAttachment } from "react-icons/cg";
import {
  FaTachometerAlt,
  FaBook,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { HiCalendarDateRange } from "react-icons/hi2";
import { IoAnalytics } from "react-icons/io5";
import { MdFeedback } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { NavLink } from "react-router-dom";

const AdminSidebar = () => {
  return (
    <aside className="bg-[#1E449D] text-white w-64 h-screen fixed top-0 left-0 flex flex-col shadow-lg">
      <div className="text-2xl font-bold py-4 px-4 border-b border-white/20">
        Navigation
      </div>
      <nav className="flex flex-col mt-6 space-y-2 px-4">
        <NavItem
          icon={<FaTachometerAlt />}
          label="Dashboard"
          to="/admin/dashboard"
        />
        <NavItem icon={<FaBook />} label="Students" to="/admin/student" />
        <NavItem icon={<SlCalender />} label="Teachers" to="/admin/teacher" />
        <NavItem
          icon={<IoAnalytics />}
          label="Departments"
          to="/admin/department"
        />
        <NavItem
          icon={<FaClipboardList />}
          label="Attendance"
          to="/admin/attendance"
        />
        <NavItem
          icon={<FaClipboardList />}
          label="Assignments"
          to="/admin/assignment"
        />
        <NavItem icon={<MdFeedback />} label="Analytics" to="/admin/analytics" />
        <NavItem icon={<MdFeedback />} label="Fees" to="/admin/fee" />
        <NavItem icon={<FiSettings />} label="Settings" to="/admin/" />
        <NavItem icon={<FaSignOutAlt />} label="Logout" to="/admin/" />
      </nav>
    </aside>
  );
};

const NavItem = ({ icon, label, to }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-white hover:text-[#2C3E50] transition ${
        isActive ? "bg-white text-[#2C3E50] font-semibold" : ""
      }`
    }
    end
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default AdminSidebar;
