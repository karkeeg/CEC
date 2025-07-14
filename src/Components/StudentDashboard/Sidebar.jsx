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

const Sidebar = ({ open, setOpen }) => {
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
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`bg-[#1E449D] text-white w-64 h-screen fixed top-0 left-0 z-50 shadow-lg transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${open ? "" : "pointer-events-none md:pointer-events-auto"}
          md:static md:block md:fixed md:top-0 md:left-0 md:z-50
        `}
        style={{
          // Always visible on md+, controlled by open on mobile
          display: open ? "block" : undefined,
        }}
      >
        {sidebarContent}
      </aside>
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
