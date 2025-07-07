import React, { useState } from "react";
import {
  FaSearch,
  FaBars,
  FaSignInAlt,
  FaUserPlus,
  FaEnvelope,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

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
    dropdown: ["Engineering ▸", "Management ▸", "Health/Medical/IT ▸"],
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
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openMobileSubDropdown, setOpenMobileSubDropdown] = useState(null);

  return (
    <nav className="bg-[#1b3e94] text-white font-semibold w-full shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center h-[94px] gap-x-6">
          <Link to="/" className="flex items-center gap-2 min-w-[64px]">
            <img src={logo} alt="Logo" className="w-24 h-24 object-contain" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex flex-1 items-center justify-between">
            {/* Search */}
            <div className="relative mr-4">
              <input
                type="text"
                placeholder="Search"
                className="pl-4 pr-8 py-1.5 rounded-full bg-[#b3e3f7] text-black placeholder:text-gray-600 focus:outline-none text-sm"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 text-xs" />
            </div>

            {/* Nav Links */}
            <ul className="flex items-center gap-2 xl:gap-2">
              {navItems.map((item, idx) => (
                <li
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() => setOpenDropdown(idx)}
                  onMouseLeave={() => {
                    setOpenDropdown(null);
                    setOpenSubDropdown(null);
                  }}
                >
                  {item.label === "Departments" ? (
                    <>
                      <button className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition flex items-center ">
                        {item.label} <span className="ml-1">▾</span>
                      </button>

                      {openDropdown === idx && (
                        <div className="absolute left-0 top-full min-w-[200px] bg-white text-[#1b3e94] rounded shadow-lg py-2 z-20">
                          {item.dropdown.map((cat) => {
                            const catKey = cat.replace(/ ▸$/, "");
                            return (
                              <div
                                key={cat}
                                className="relative group"
                                onMouseEnter={() => setOpenSubDropdown(catKey)}
                                onMouseLeave={() => setOpenSubDropdown(null)}
                              >
                                <div className="flex justify-between items-center px-4 py-2 hover:bg-[#e6f7ff] hover:text-[#3cb4d4] cursor-pointer">
                                  {catKey} <span>▸</span>
                                </div>

                                {openSubDropdown === catKey && (
                                  <div className="absolute left-full top-0 min-w-[220px] bg-white text-[#1b3e94] rounded shadow-lg py-2 z-30">
                                    {item.subDropdown[catKey].map(
                                      (course, cidx) => (
                                        <div
                                          key={cidx}
                                          className="px-4 py-2 hover:bg-[#e6f7ff] hover:text-[#3cb4d4] cursor-pointer whitespace-nowrap"
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
                      <button className="px-3 py-2 hover:bg-[#3cb4d4] rounded transition flex items-center gap-1">
                        {item.label} <span className="ml-1">▾</span>
                      </button>

                      {openDropdown === idx && (
                        <div className="absolute left-0 top-full min-w-[160px] bg-white text-[#1b3e94] rounded shadow-lg py-2 z-20">
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
            </ul>

            {/* Right Buttons Container */}
            <div className="flex items-center border border-white rounded-full p-1 ml-auto">
              <Link to="/login" title="Login">
                <button className="p-2 rounded-full hover:bg-[#3cb4d4] transition">
                  <FaSignInAlt size={22} />
                </button>
              </Link>
              <Link to="/register" title="Register">
                <button className="p-2 rounded-full hover:bg-[#3cb4d4] transition">
                  <FaUserPlus size={22} />
                </button>
              </Link>
              <a href="#contact" title="Contact" className="scroll-smooth">
                <button className="p-2 rounded-full hover:bg-[#fbbf24] transition">
                  <FaEnvelope size={22} />
                </button>
              </a>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded hover:bg-[#3cb4d4]"
            onClick={() => setMobileMenu((prev) => !prev)}
          >
            {mobileMenu ? <IoMdClose size={24} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="lg:hidden bg-[#1b3e94] w-full py-4 px-2 rounded-b-xl shadow-xl z-30">
            <ul className="flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <li key={item.label} className="relative">
                  {item.label === "Academic Program" ? (
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
            </ul>

            <div className="flex gap-2 mt-4">
              <Link to="/login" className="flex-1">
                <button className="w-full p-2 rounded-full hover:bg-[#3cb4d4]">
                  <FaSignInAlt size={22} className="mx-auto" />
                </button>
              </Link>
              <Link to="/register" className="flex-1">
                <button className="w-full p-2 rounded-full hover:bg-[#3cb4d4]">
                  <FaUserPlus size={22} className="mx-auto" />
                </button>
              </Link>
              <a href="#contact" className="flex-1">
                <button className="w-full p-2 rounded-full hover:bg-[#fbbf24]">
                  <FaEnvelope size={22} className="mx-auto" />
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
