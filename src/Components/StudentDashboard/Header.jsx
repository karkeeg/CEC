import React, { useState } from "react";
import { FaBell, FaUser, FaSignOutAlt, FaCog, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import avatar from "../../assets/logo.png";
import { BiUser } from "react-icons/bi";
import { FaCircleUser } from "react-icons/fa6";

const Header = ({ onHamburgerClick }) => {
  const { user, profile, signOut } = useUser();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    return user?.email?.split("@")[0] || "Student";
  };

  function getLastUrl(val) {
    if (Array.isArray(val)) return val.length > 0 ? val[val.length - 1] : "";
    return val || "";
  }
  const profileImg = profile ? getLastUrl(profile.profile_pic) : "";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-[80px] z-50 flex justify-between items-center pl-4 md:pl-10 pr-4 md:pr-12 py-5 bg-[#1E449D] text-white shadow transition-all">
      {/* Hamburger for mobile */}
      <button
        className="md:hidden mr-2 text-2xl focus:outline-none"
        onClick={onHamburgerClick}
        aria-label="Open sidebar"
      >
        <FaBars />
      </button>
      <h1 className="text-xl font-semibold">
        Welcome back, {getUserDisplayName()}!
      </h1>
      <div className="flex items-center gap-4">
        <FaBell className="text-white text-lg cursor-pointer hover:text-blue-200 transition" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-blue-700 rounded-full p-1 transition"
          >
            <div className="flex items-center gap-3">
              {profileImg ? (
                <img
                  src={profileImg}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover border border-white"
                />
              ) : (
                <FaCircleUser className="text-4xl text-gray-950" />
              )}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 sm:w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <FaCircleUser className="text-5xl text-gray-950" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    {profile && (
                      <p className="text-xs text-gray-500">
                        {profile.faculty} {profile.department}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1 max-h-60 overflow-y-auto">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
                  role="menuitem"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/student/profile");
                  }}
                >
                  <FaUser className="text-gray-500 text-lg" />
                  <span>Profile</span>
                </button>
                {/* Optionally keep Settings button here */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
                  role="menuitem"
                >
                  <FaCog className="text-gray-500 text-lg" />
                  <span>Settings</span>
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition"
                  role="menuitem"
                >
                  <FaSignOutAlt className="text-red-500 text-lg" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;
