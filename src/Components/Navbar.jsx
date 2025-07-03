import React from "react";
import { FaSearch } from "react-icons/fa";
import logo from "../assets/logo.png";

const Navbar = () => {
  return (
    <div className="bg-[#1b3e94] text-white text-sm font-semibold">
      <div className="max-w-7xl mx-auto px-4 lg:px-[120px] py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/*Logo */}
          <div className="flex items-center gap-6">
            <img
              src={logo}
              alt="Logo"
              className="w-[140px] h-[140px] object-contain"
            />
          </div>

          
            {/* Navigation */}
          <div className="flex flex-col w-full lg:w-auto">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-4 pr-8 py-1.5 rounded-full bg-[#b3e3f7] text-black placeholder:text-gray-600 focus:outline-none"
                />
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 text-xs" />
              </div>

              {/* Top Menu Items + Contact Button */}
              <div className="flex items-center border-t border-white/30 flex-wrap gap-4">
                {[
                  "ACADEMIC PROGRAM ▾",
                  "LIBRARY",
                  "EXAM ▾",
                  "RESULT",
                  "ONLINE FORM",
                ].map((item, i) => (
                  <span
                    key={i}
                    className="hover:underline cursor-pointer whitespace-nowrap"
                  >
                    {item}
                  </span>
                ))}

                {/* Contact Us Button */}
                <button className="bg-[#3cb4d4] hover:bg-[#36a4c0] px-4 py-1 rounded text-white">
                  CONTACT US
                </button>
              </div>
            </div>

            {/* Bottom Nav Row */}
            <div className="flex flex-wrap items-center justify-center border-b border-white/30 lg:justify-start pt-2 gap-6">
              {[
                "HOME ▾",
                "ABOUT ▾",
                "DEPARTMENT ▾",
                "STAFF ▾",
                "DOWNLOAD ▾",
                "ADMISSIONS",
                "GALLERY",
                "NOTICE",
              ].map((item, i) => (
                <span
                  key={i}
                  className="hover:underline cursor-pointer whitespace-nowrap"
                >
                  {item}
                </span>
              ))}

              {/* Login Button */}
              <button className="bg-[#3cb4d4] hover:bg-[#36a4c0] px-4 py-1 rounded text-white">
                LOGIN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
