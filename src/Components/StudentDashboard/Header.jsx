import React, { useState } from "react";
import { FaBell, FaUser, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import avatar from "../../assets/logo.png";
import { BiUser } from "react-icons/bi";
import { FaCircleUser } from "react-icons/fa6";

const Header = () => {
  const { user, profile, signOut } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  const getUserDisplayName = () => {
    if (profile) {
      if (profile.first_name && profile.last_name) {
        return `${profile.first_name} ${profile.last_name}`;
      } else if (profile.first_name) {
        return profile.first_name;
      }
    }
    return user?.email?.split("@")[0] || "Student";
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 left-64 right-0 z-50 flex justify-between items-center pl-10 pr-12 py-5 bg-[#1E449D] text-white shadow">
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
            <img
              src={avatar}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover border-2 border-white"
            />
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
                        {profile.faculty}  {profile.department}
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
                >
                  <FaUser className="text-gray-500 text-lg" />
                  <span>Profile</span>
                </button>
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
