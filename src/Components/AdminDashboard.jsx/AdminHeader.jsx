import React, { useEffect, useMemo, useState } from "react";
import { FaBell, FaUser, FaSignOutAlt, FaCog, FaBars } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import avatar from "../../assets/logo.png";
import { FaCircleUser } from "react-icons/fa6";
import { fetchNotificationsPaged } from "../../supabaseConfig/supabaseApi";
// Removed Modal for notifications per request

const AdminHeader = ({ onHamburgerClick }) => {
  const { user, profile, signOut } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 10;
  const [badgeUnreadCount, setBadgeUnreadCount] = useState(0);

  // Unread tracking stored per admin id
  const storageKey = useMemo(() => {
    if (!user?.id) return null;
    return `notif_read_admin_${user.id}`;
  }, [user?.id]);
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    try {
      if (!storageKey) {
        setReadIds(new Set());
        return;
      }
      const raw = localStorage.getItem(storageKey);
      setReadIds(new Set(raw ? JSON.parse(raw) : []));
    } catch {
      setReadIds(new Set());
    }
  }, [storageKey]);

  const persistRead = (next) => {
    try {
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {}
  };

  const toggleReadOne = (id) => {
    if (!id) return;
    const next = new Set(readIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReadIds(next);
    persistRead(next);
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => n.id && next.add(n.id));
    setReadIds(next);
    persistRead(next);
  };

  const markAllAsUnread = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => n.id && next.delete(n.id));
    setReadIds(next);
    persistRead(next);
  };

  // Load initial page when dropdown opens
  useEffect(() => {
    const loadInitial = async () => {
      if (!showNotifDropdown) return;
      setIsLoading(true);
      try {
        const { data, error } = await fetchNotificationsPaged(PAGE_SIZE, 0);
        if (!error) {
          setNotifications(data || []);
          setOffset((data?.length || 0));
          setHasMore((data?.length || 0) === PAGE_SIZE);
        }
      } catch (_) {
        setNotifications([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [showNotifDropdown]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const { data, error } = await fetchNotificationsPaged(PAGE_SIZE, offset);
      if (!error) {
        const next = data || [];
        setNotifications((prev) => [...prev, ...next]);
        setOffset(offset + next.length);
        setHasMore(next.length === PAGE_SIZE);
      }
    } catch (_) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) {
      loadMore();
    }
  };

  // Background polling for unread badge
  useEffect(() => {
    let timer;
    const computeBadge = async () => {
      try {
        const { data } = await fetchNotificationsPaged(10, 0);
        const list = data || [];
        const count = list.reduce((acc, n) => (n.id && !readIds.has(n.id) ? acc + 1 : acc), 0);
        setBadgeUnreadCount(count);
      } catch {
        // ignore
      }
    };
    computeBadge();
    timer = setInterval(computeBadge, 30000);
    return () => timer && clearInterval(timer);
  }, [readIds]);

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
          {badgeUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {badgeUnreadCount}
            </span>
          )}
          {showNotifDropdown && (
            <div
              className="absolute right-0  w-80 bg-white rounded-md shadow-lg mt-2  z-50 max-h-96 overflow-y-auto scrollbar-hidden"
            >
              <div className="px-4 py-2 text-lg font-semibold bg-[#1E449D] text-white rounded-t-md flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center gap-3">
                  <button onClick={markAllAsUnread} className="text-xs text-white hover:underline">Mark all unread</button>
                  <button onClick={markAllAsRead} className="text-xs text-white hover:underline">Mark all read</button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-4 text-gray-500">No notification.</div>
              ) : (
                <>
                  {[...notifications]
                    .sort((a, b) => {
                      const aUnread = a.id && !readIds.has(a.id);
                      const bUnread = b.id && !readIds.has(b.id);
                      if (aUnread !== bUnread) return aUnread ? -1 : 1;
                      return new Date(b.date) - new Date(a.date);
                    })
                    .map((notif, idx) => {
                      const isUnread = notif.id && !readIds.has(notif.id);
                      return (
                        <div
                          key={notif.id || idx}
                          className={`px-4 py-2 border-b last:border-b-0 ${typeBgClass[notif.type] || typeBgClass.default} ${isUnread ? "bg-opacity-90" : "opacity-100"}`}
                          onClick={() => toggleReadOne(notif.id)}
                        >
                          <div className="font-medium text-gray-900">{notif.message}</div>
                          <div className="text-xs text-gray-500">{new Date(notif.date).toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{isUnread ? "(click to mark read)" : "(click to mark unread)"}</div>
                        </div>
                      );
                    })}
                  <div className="flex gap-2 justify-center mt-2 py-2">
                    {hasMore && (
                      <button
                        disabled={isLoading}
                        className={`px-3 py-1 rounded text-white ${isLoading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"}`}
                        onClick={loadMore}
                      >
                        {isLoading ? "Loading..." : "Load more"}
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
