import React, { useState } from "react";
import { FaBell, FaUser, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import { FaCircleUser } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const TeacherHeader = () => {
  const { user, profile, signOut, profileUrl } = useUser();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    return user?.email?.split("@")[0] || "Teacher";
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-[64px] md:h-[80px] z-40 flex justify-between items-center px-4 md:pl-10 md:pr-12 py-3 md:py-5 bg-[#1E449D] text-white shadow transition-all">
      <h1 className="text-lg md:text-xl font-semibold truncate">
        Welcome back, {getUserDisplayName()}!
      </h1>
      <div className="flex items-center gap-3 md:gap-4">
        <FaBell className="text-white text-lg cursor-pointer hover:text-blue-200 transition" />
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-blue-700 rounded-full p-1 transition"
          >
            <div className="flex items-center gap-2 md:gap-3">
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover border border-white"
                />
              ) : (
                <FaCircleUser className="text-3xl md:text-4xl text-gray-950" />
              )}
            </div>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <p className="font-medium">{getUserDisplayName()}</p>
                <p className="text-gray-500">Teacher</p>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/teacher/profile");
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaUser />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaSignOutAlt />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;
