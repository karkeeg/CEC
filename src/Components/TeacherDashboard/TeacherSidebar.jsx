import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaBook,
  FaCalendarCheck,
  FaChartBar,
  FaCog,
  FaClipboardList,
  FaGraduationCap,
  FaSignOutAlt,
} from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";

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

const TeacherSidebar = () => {
  const { signOut } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Sidebar content as a function for reuse
  const sidebarContent = (
    <>
      <div className="text-2xl font-bold py-6 px-6 border-b border-white/20">
        Navigation
      </div>
      <nav className="flex flex-col mt-6 space-y-2 px-4">
        <NavItem
          icon={<FaTachometerAlt />}
          label="Dashboard"
          to="/teacher/dashboard"
        />
        <NavItem
          icon={<FaUsers />}
          label="My Students"
          to="/teacher/students"
        />
        <NavItem icon={<FaBook />} label="My Classes" to="/teacher/classes" />
        <NavItem
          icon={<FaClipboardList />}
          label="Assignments"
          to="/teacher/assignments"
        />
        <NavItem
          icon={<FaCalendarCheck />}
          label="Attendance"
          to="/teacher/attendance"
        />
        <NavItem
          icon={<FaGraduationCap />}
          label="Grades"
          to="/teacher/grades"
        />
        <NavItem
          icon={<FaChartBar />}
          label="Analytics"
          to="/teacher/analytics"
        />
        <NavItem icon={<FaCog />} label="Settings" to="/teacher/settings" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-white hover:text-[#2C3E50] transition mt-2"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </nav>
    </>
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
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-[#1E449D] text-white w-64 h-full flex-col shadow-lg animate-slideInLeft">
            <div className="flex justify-between items-center px-6 py-6 border-b border-white/20">
              <span className="text-2xl font-bold">Navigation</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <nav className="flex flex-col mt-6 space-y-2 px-4">
              <NavItem
                icon={<FaTachometerAlt />}
                label="Dashboard"
                to="/teacher/dashboard"
              />
              <NavItem
                icon={<FaUsers />}
                label="My Students"
                to="/teacher/students"
              />
              <NavItem
                icon={<FaBook />}
                label="My Classes"
                to="/teacher/classes"
              />
              <NavItem
                icon={<FaClipboardList />}
                label="Assignments"
                to="/teacher/assignments"
              />
              <NavItem
                icon={<FaCalendarCheck />}
                label="Attendance"
                to="/teacher/attendance"
              />
              <NavItem
                icon={<FaGraduationCap />}
                label="Grades"
                to="/teacher/grades"
              />
              <NavItem
                icon={<FaChartBar />}
                label="Analytics"
                to="/teacher/analytics"
              />
              <NavItem
                icon={<FaCog />}
                label="Settings"
                to="/teacher/settings"
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
          {/* Overlay */}
          <div
            className="flex-1 bg-black bg-opacity-40"
            onClick={() => setOpen(false)}
          ></div>
        </div>
      )}
    </>
  );
};

export default TeacherSidebar;
