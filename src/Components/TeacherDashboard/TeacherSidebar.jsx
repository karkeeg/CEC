import React from "react";
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
    </aside>
  );
};

export default TeacherSidebar;
