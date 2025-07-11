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
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

const Sidebar = () => {
  const { signOut } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="bg-[#1E449D] text-white w-64 h-screen fixed top-0 left-0 flex flex-col shadow-lg">
      <div className="text-2xl font-bold py-6 px-6 border-b border-white/20">
        Navigation
      </div>
      <nav className="flex flex-col mt-6 space-y-2 px-4">
        <NavItem
          icon={<FaTachometerAlt />}
          label="Dashboard"
          to="/student/dashboard"
        />
        <NavItem icon={<FaBook />} label="Classes" to="/student/classes" />
        <NavItem
          icon={<FaClipboardList />}
          label="Assignments"
          to="/student/assignment"
        />
        <NavItem
          icon={<SlCalender />}
          label="Attendance"
          to="/student/attendance"
        />
        <NavItem
          icon={<IoAnalytics />}
          label="Analytics"
          to="/student/analytics"
        />
        <NavItem
          icon={<MdFeedback />}
          label="Feedback"
          to="/student/feedback"
        />
        <NavItem
          icon={<FiSettings />}
          label="Settings"
          to="/student/settings"
        />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-white hover:text-[#2C3E50] transition mt-2"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
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

export default Sidebar;
