import {
  FaTachometerAlt,
  FaBook,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { IoAnalytics } from "react-icons/io5";
import { MdFeedback } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import React, { useState } from "react";

const Sidebar = (props) => {
  // Support both controlled (via props) and uncontrolled (local state) usage
  const [localOpen, setLocalOpen] = useState(false);
  const open = props.open !== undefined ? props.open : localOpen;
  const setOpen = props.setOpen !== undefined ? props.setOpen : setLocalOpen;

  const { signOut } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="text-2xl font-bold py-6 px-6 border-b border-white/20 flex justify-between items-center">
        <span>Navigation</span>
        {/* Close button for mobile */}
        <button
          className="md:hidden text-3xl text-white focus:outline-none"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          &times;
        </button>
      </div>
      <nav className="flex flex-col mt-6 space-y-2 px-4 flex-1">
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-[#1E449D] text-white w-64 h-screen fixed top-0 left-0 flex-col shadow-lg hidden md:flex z-40">
        {sidebarContent}
      </aside>
      {/* Mobile Hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#1E449D] text-white p-2 rounded-lg shadow-lg focus:outline-none"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {/* Mobile Drawer */}
      {open && (
        <>
          <div className="bg-[#1E449D] text-white w-64 fixed top-0 left-0 h-full z-[999] flex-col shadow-lg animate-slideInLeft md:hidden">
            {sidebarContent}
          </div>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[998] bg-black bg-opacity-40 md:hidden"
            onClick={() => setOpen(false)}
          />
        </>
      )}
    </>
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
