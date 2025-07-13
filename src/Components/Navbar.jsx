import React, { useState } from "react";
import {
  FaSearch,
  FaBars,
  FaSignInAlt,
  FaUserPlus,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaTachometerAlt,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { MdDashboard } from "react-icons/md";

const navItems = [
  {
    label: "Home",
    dropdown: ["Main", "News & Events", "Gallery"],
  },
  {
    label: "About",
    dropdown: ["Vision & Mission", "History", "Administration"],
  },
  {
    label: "Departments",
    dropdown: ["Engineering ", "Management ", "Health/Medical/IT "],
    subDropdown: {
      Engineering: [
        "MSC Engineering (Proposed)",
        "Bachelor In Civil Engineering",
        "Bachelor in Electrical Engineering",
        "Bachelor of Information Technology",
        "Diploma In Civil Engineering",
        "Diploma In Electrical Engineering",
        "Pre Diploma in Electrical Engineering",
        "Pre Diploma In Civil Engineering",
        "Pre Diploma In Computer Engineering",
      ],
      Management: [
        "Masters In Business Administration",
        "Bachelor Of Business Administration",
      ],
      "Health/Medical/IT": [
        "General Medicine (HA)",
        "Diploma in Radiography",
        "PCL Health Lab Technician",
        "Diploma in Pharmacy",
      ],
    },
  },
  {
    label: "Exam",
    dropdown: ["Schedule", "Results", "Online Form"],
  },
  {
    label: "Download",
    dropdown: [
      "Syllabus",
      "Past Questions",
      "Project",
      "Document",
      "CEC Material",
    ],
  },
  {
    label: "Staff",
    dropdown: ["Administrative", "Academic"],
  },

  {
    label: "Gallery",
    link: "/gallery",
  },
];

const Navbar = () => {
  const { user, profile, signOut } = useUser();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openMobileSubDropdown, setOpenMobileSubDropdown] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getUserDisplayName = () => {
    if (profile) {
      if (profile.first_name && profile.last_name) {
        return `${profile.first_name} ${profile.last_name}`;
      } else if (profile.first_name) {
        return profile.first_name;
      }
    }
    return user?.email?.split("@")[0] || "User";
  };

  const getUserRole = () => {
    const role = user?.user_metadata?.role?.toLowerCase();
    if (role === "admin") return "Administrator";
    if (role === "student") return "Student";
    if (role === "teacher") return "Teacher";
    return "User";
  };

  const getDashboardLink = () => {
    const role = user?.user_metadata?.role?.toLowerCase();
    if (role === "admin") return "/admin/dashboard";
    if (role === "student") return "/student/dashboard";
    if (role === "teacher") return "/teacher/dashboard";
    return "/login";
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <nav className="bg-[#1b3e94] text-white font-semibold w-full shadow top-0 z-50">
      <div className="max-w-8xl mx-auto px-2 sm:px-4 md:px-6 xl:px-8">
        <div className="flex items-center h-[60px] md:h-[64px] xl:h-[70px] gap-x-2 md:gap-x-4 w-full justify-between">
          {/* Left: Logo */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center min-w-[100px] md:min-w-[120px] hover:opacity-90 transition-all duration-300 group"
              aria-label="Go to homepage"
            >
              <img
                src={logo}
                alt="Central Engineering College logo"
                className="w-12 h-12 md:w-14 md:h-14 xl:w-16 xl:h-16 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
              />
              <div className="flex flex-col leading-tight ml-2">
                <span className="text-base md:text-lg xl:text-2xl font-bold text-white drop-shadow-sm">
                  Central Engineering
                </span>
                <span className="text-xs md:text-sm xl:text-base font-medium text-white/80 tracking-wide">
                  College
                </span>
              </div>
            </Link>
          </div>
          {/* Center: Nav Items (hidden on xl and below) */}
          <div className="hidden xl:flex items-center justify-center flex-1 min-w-0">
            <ul className="flex items-center flex-wrap gap-x-2">
              {navItems.map((item, idx) => (
                <li key={item.label} className="relative">
                  {item.label === "Departments" ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(idx)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition flex items-center gap-1">
                        {item.label} <span className="ml-1">▾</span>
                      </button>
                      {openDropdown === idx && (
                        <div className="absolute left-0 top-full min-w-[200px] bg-white text-[#1b3e94] rounded shadow-lg py-2 z-50 overflow-visible">
                          {item.dropdown.map((cat) => {
                            const catKey = cat.replace(/ $/, "");
                            return (
                              <div
                                key={cat}
                                className="relative group"
                                onMouseEnter={() => setOpenSubDropdown(catKey)}
                                onMouseLeave={() => setOpenSubDropdown(null)}
                              >
                                <div className="px-4 py-2 hover:bg-[#e6f7ff] hover:text-[#3cb4d4] whitespace-nowrap cursor-pointer flex justify-between items-center">
                                  {catKey} <span>▸</span>
                                </div>
                                {openSubDropdown === catKey && (
                                  <div className="absolute left-full top-0 min-w-[250px] bg-white text-[#1b3e94] rounded shadow-lg z-50 overflow-visible">
                                    {item.subDropdown[catKey].map(
                                      (course, cidx) => (
                                        <div
                                          key={cidx}
                                          className="px-4 py-2 hover:bg-[#e6f7ff] hover:text-[#3cb4d4] whitespace-nowrap cursor-pointer"
                                        >
                                          {course}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : item.dropdown ? (
                    <>
                      <button
                        className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition flex items-center gap-1"
                        onMouseEnter={() => setOpenDropdown(idx)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {item.label} <span className="ml-1"></span>
                      </button>

                      {openDropdown === idx && (
                        <div
                          className="absolute left-0 top-full min-w-[160px] bg-white text-[#1b3e94] rounded shadow-lg py-2 z-20"
                          onMouseEnter={() => setOpenDropdown(idx)}
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          {item.dropdown.map((sub, subIdx) => (
                            <Link
                              to={`/${item.label
                                .toLowerCase()
                                .replace(/\s/g, "-")}/${sub
                                .toLowerCase()
                                .replace(/\s/g, "-")}`}
                              key={subIdx}
                              className="block px-4 py-2 hover:bg-[#e6f7ff] hover:text-[#3cb4d4] whitespace-nowrap"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.link}
                      className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              {/* Add Notices item */}
              <li className="relative">
                <Link
                  to="/notices"
                  className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition"
                >
                  Notices
                </Link>
              </li>
            </ul>
          </div>
          {/* Right: User/Icons (hidden on xl and below) */}
          <div className="hidden xl:flex items-center gap-2 ml-2">
            {user ? (
              <>
                {/* Dashboard Button */}
                <div className="flex flex-col items-center">
                  <Link to={getDashboardLink()} title="Dashboard">
                    <button className="p-2 rounded-full hover:bg-[#3cb4d4] transition flex flex-col items-center">
                      <MdDashboard size={26} />
                      <span className="text-xs mt-1">Dashboard</span>
                    </button>
                  </Link>
                </div>
                {/* User Profile Dropdown */}
                <div className="relative flex flex-col items-center">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex flex-col items-center gap-1 hover:bg-[#3cb4d4] rounded-full p-1 transition"
                    title="Profile"
                  >
                    <img
                      src={logo}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border border-white"
                    />
                    <span className="text-xs mt-1">Profile</span>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={logo}
                            alt="Profile"
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user?.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getUserRole()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link to={getDashboardLink()}>
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition">
                            <MdDashboard className="text-gray-500" />
                            <span>Dashboard</span>
                          </button>
                        </Link>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition">
                          <FaUser className="text-gray-500" />
                          <span>Profile</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition">
                          <FaCog className="text-gray-500" />
                          <span>Settings</span>
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition"
                        >
                          <FaSignOutAlt />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <Link to="/login" title="Login">
                    <button className="p-2 rounded-full hover:bg-[#3cb4d4] transition flex flex-col items-center">
                      <FaSignInAlt size={26} />
                      <span className="text-xs mt-1">Login</span>
                    </button>
                  </Link>
                </div>
                <div className="flex flex-col items-center">
                  <a href="#contact" title="Contact" className="scroll-smooth">
                    <button className="p-2 rounded-full hover:bg-[#fbbf24] transition flex flex-col items-center">
                      <FaEnvelope size={26} />
                      <span className="text-xs mt-1">Contact</span>
                    </button>
                  </a>
                </div>
              </>
            )}
          </div>
          {/* Hamburger for mobile/tablet (xl and below) */}
          <div className="flex xl:hidden flex-1 justify-end">
            <button
              className="p-2 md:p-3 text-end rounded hover:bg-[#3cb4d4]"
              onClick={() => setMobileMenu((prev) => !prev)}
            >
              {mobileMenu ? <IoMdClose size={28} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu (xl and below) */}
      {mobileMenu && (
        <>
          {/* Backdrop only below the navbar */}
          <div
            className="fixed left-0 w-full z-40 bg-black bg-opacity-40"
            style={{
              top: "60px",
              height: "calc(100vh - 60px)",
            }}
            onClick={() => setMobileMenu(false)}
          />
          {/* Mobile Menu Overlay below the navbar */}
          <div
            className="fixed left-0 w-full z-50 bg-[#1b3e94] py-6 px-2 md:px-6 rounded-b-xl shadow-xl overflow-y-auto"
            style={{
              top: "60px",
              height: "calc(100vh - 60px)",
            }}
          >
            {/* User Info for Mobile */}
            {user && (
              <div className="px-4 py-3 border-b border-white/20 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover border border-white"
                  />
                  <div>
                    <p className="font-semibold text-white">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-blue-200">{user?.email}</p>
                    <p className="text-xs text-blue-300">{getUserRole()}</p>
                  </div>
                </div>
              </div>
            )}

            <ul className="flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <li key={item.label} className="relative">
                  {item.label === "Departments" ? (
                    <>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[#3cb4d4] rounded flex justify-between items-center"
                        onClick={() =>
                          setOpenDropdown(openDropdown === idx ? null : idx)
                        }
                      >
                        {item.label} <span>▾</span>
                      </button>
                      {openDropdown === idx && (
                        <div className="pl-4 py-1">
                          {item.dropdown.map((cat) => {
                            const catKey = cat.replace(/ ▸$/, "");
                            return (
                              <div key={cat}>
                                <button
                                  className="w-full flex justify-between items-center px-4 py-2 hover:bg-[#e6f7ff]"
                                  onClick={() =>
                                    setOpenMobileSubDropdown(
                                      openMobileSubDropdown === catKey
                                        ? null
                                        : catKey
                                    )
                                  }
                                >
                                  {catKey} <span>▾</span>
                                </button>
                                {openMobileSubDropdown === catKey && (
                                  <div className="pl-4">
                                    {item.subDropdown[catKey].map(
                                      (course, cidx) => (
                                        <div
                                          key={cidx}
                                          className="px-4 py-2 hover:bg-[#e6f7ff] text-white text-sm"
                                        >
                                          {course}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : item.dropdown ? (
                    <>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[#3cb4d4] rounded flex justify-between items-center"
                        onClick={() =>
                          setOpenDropdown(openDropdown === idx ? null : idx)
                        }
                      >
                        {item.label} <span>▾</span>
                      </button>
                      {openDropdown === idx && (
                        <div className="pl-4 py-1">
                          {item.dropdown.map((sub, subIdx) => (
                            <Link
                              to={`/${item.label
                                .toLowerCase()
                                .replace(/\s/g, "-")}/${sub
                                .toLowerCase()
                                .replace(/\s/g, "-")}`}
                              key={subIdx}
                              className="block px-2 py-1 hover:bg-[#e6f7ff] rounded"
                              onClick={() => setMobileMenu(false)}
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.link}
                      className="block px-3 py-2 hover:bg-[#3cb4d4] rounded"
                      onClick={() => setMobileMenu(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              {/* Add Notices item */}
              <li className="relative">
                <Link
                  to="/notices"
                  className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition block"
                >
                  Notices
                </Link>
              </li>
            </ul>

            <div className="flex gap-2 mt-4">
              {user ? (
                <>
                  <Link to={getDashboardLink()} className="flex-1">
                    <button className="w-full p-2 rounded-full hover:bg-[#3cb4d4]">
                      <MdDashboard size={22} className="mx-auto" />
                    </button>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 p-2 rounded-full hover:bg-red-600"
                  >
                    <FaSignOutAlt size={22} className="mx-auto" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <button className="w-full p-2 rounded-full hover:bg-[#3cb4d4]">
                      <FaSignInAlt size={22} className="mx-auto" />
                    </button>
                  </Link>
                  <a href="#contact" className="flex-1">
                    <button className="w-full p-2 rounded-full hover:bg-[#fbbf24]">
                      <FaEnvelope size={22} className="mx-auto" />
                    </button>
                  </a>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {/* Backdrop to close user dropdown */}
      {showUserDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
