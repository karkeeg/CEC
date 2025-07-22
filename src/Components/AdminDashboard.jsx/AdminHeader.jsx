import React, { useState } from "react";
import { FaBell, FaUser, FaSignOutAlt, FaCog, FaBars } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import avatar from "../../assets/logo.png";
import { FaCircleUser } from "react-icons/fa6";
import { fetchNotifications } from "../../supabaseConfig/supabaseApi";
import { useEffect } from "react";

const AdminHeader = ({ onHamburgerClick }) => {
  const { user, profile, signOut } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [visibleNotifCount, setVisibleNotifCount] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await fetchNotifications();
        if (!error) setNotifications(data || []);
      } catch (e) {
        setNotifications([]);
      }
    };
    fetchData();
  }, []);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    return user?.email?.split("@")?.[0] || "Admin";
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const typeBgClass = {
    notice: "bg-blue-100",
    assignment: "bg-purple-100",
    submission: "bg-green-100",
    student: "bg-cyan-100",
    teacher: "bg-yellow-100",
    class: "bg-orange-100",
    attendance: "bg-pink-100",
    fee: "bg-red-100",
    default: "bg-gray-100"
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
        <div className="relative">
          <FaBell
            className="text-white text-lg cursor-pointer hover:text-blue-200 transition"
            onClick={() => setShowNotifDropdown((prev) => !prev)}
          />
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 text-lg font-semibold text-gray-800 border-b">
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-4 text-gray-500">No notifications.</div>
              ) : (
                <>
                  {notifications
                    .slice(0, visibleNotifCount)
                    .map((notif, idx) => (
                      <div
                        key={notif.id || idx}
                        className={`px-4 py-2 border-b last:border-b-0 ${typeBgClass[notif.type] || typeBgClass.default}`}
                      >
                        <div className="font-medium text-gray-900">
                          {notif.message}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(notif.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  <div className="flex gap-2 justify-center mt-2">
                    {visibleNotifCount < notifications.length && (
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => setVisibleNotifCount((prev) => prev + 3)}
                      >
                        See More
                      </button>
                    )}
                    {visibleNotifCount > 3 && (
                      <button
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                        onClick={() => setVisibleNotifCount(3)}
                      >
                        See Less
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-blue-700 rounded-full p-1 transition"
          >
            <div className="flex items-center gap-3">
              <FaCircleUser className="text-4xl text-gray-950" />
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <p className="font-medium">{getUserDisplayName()}</p>
                <p className="text-gray-500">Admin</p>
              </div>
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

export default AdminHeader;
