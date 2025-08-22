import React, { useEffect, useMemo, useState } from "react";
import { FaBell, FaBars, FaSignOutAlt } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
  fetchNotificationsPaged,
  getRecentNotices,
  getAssignmentsForStudent,
  getAttendanceByStudent,
  getAssignmentsByTeacher,
  fetchAssignmentSubmissions,
  fetchNotificationsGlobalPaged,
} from "../../supabaseConfig/supabaseApi";
// Removed Modal for notifications per request

const typeBgClass = {
  notice: "bg-blue-100",
  assignment: "bg-purple-100",
  submission: "bg-green-100",
  student: "bg-cyan-100",
  teacher: "bg-yellow-100",
  class: "bg-orange-100",
  attendance: "bg-pink-100",
  fee: "bg-red-100",
  department: "bg-teal-100",
  admin: "bg-slate-100",
  default: "bg-gray-100",
};

const AppHeader = ({ onHamburgerClick }) => {
  const { user, profile, role: roleCtx, signOut } = useUser();
  const navigate = useNavigate();
  const role = roleCtx || profile?.role || user?.role || "student"; // expected: 'admin' | 'teacher' | 'student'
  const userId = profile?.id || user?.id || null;

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 10;
  // Badge state to reflect new/unread count even when modal is closed
  const [badgeUnreadCount, setBadgeUnreadCount] = useState(0);

  // Unread tracking per user+role via localStorage
  const storageKey = useMemo(() => {
    if (!userId) return null;
    return `notif_read_${role}_${userId}`;
  }, [role, userId]);
  const [readIds, setReadIds] = useState(new Set());

  // Sync read IDs whenever the storage key (user/role) changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persistRead = (nextSet) => {
    try {
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify([...nextSet]));
    } catch {}
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

  const toggleReadOne = (id) => {
    if (!id) return;
    const next = new Set(readIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReadIds(next);
    persistRead(next);
  };

  const unreadCount = notifications.reduce((acc, n) => (n.id && !readIds.has(n.id) ? acc + 1 : acc), 0);

  // Load initial page when dropdown opens (role-aware)
  useEffect(() => {
    const loadInitial = async () => {
      if (!showNotifDropdown) return;
      setIsLoading(true);
      try {
        if (role === "admin") {
          const { data, error } = await fetchNotificationsPaged(PAGE_SIZE, 0);
          if (!error) {
            setNotifications(data || []);
            setOffset((data?.length || 0));
            setHasMore((data?.length || 0) === PAGE_SIZE);
          }
        } else if (role === "student" && userId) {
          const now = new Date();
          const fromDate = new Date();
          fromDate.setDate(now.getDate() - 30);
          const [notices, assignments, attendance, globalPage] = await Promise.all([
            getRecentNotices(50).catch(() => []),
            getAssignmentsForStudent(userId, fromDate.toISOString()).catch(() => []),
            getAttendanceByStudent(userId, fromDate.toISOString(), now.toISOString()).catch(() => []),
            fetchNotificationsGlobalPaged(20, 0).then(r => r.data || []).catch(() => []),
          ]);
          const items = [];
          for (const n of notices || []) {
            items.push({ id: `notice_${n.notice_id}`, type: "notice", message: `Notice: ${n.title}`, date: n.created_at });
          }
          for (const a of assignments || []) {
            items.push({ id: `assign_${a.id}`, type: "assignment", message: `New assignment: ${a.title} (${a.subject?.name || "Subject"}) due ${new Date(a.due_date).toLocaleString()}`, date: a.due_date });
          }
          for (const att of attendance || []) {
            items.push({ id: `att_${att.id}`, type: "attendance", message: `Attendance marked ${att.status} on ${att.date}`, date: att.date });
          }
          // Global notifications (from notifications table, actor null)
          for (const g of globalPage || []) {
            items.push({ id: `global_${g.id || g.date}`, type: g.type || "notice", message: g.message, date: g.date });
          }
          items.sort((a, b) => new Date(b.date) - new Date(a.date));
          // client-side pagination
          setNotifications(items.slice(0, PAGE_SIZE));
          setOffset(PAGE_SIZE);
          setHasMore(items.length > PAGE_SIZE);
          // keep full list in closure for loadMore
          window.__roleItemsCache = items;
        } else if (role === "teacher" && userId) {
          const now = new Date();
          const fromDate = new Date();
          fromDate.setDate(now.getDate() - 30);
          const [notices, teacherAssignments, globalPage] = await Promise.all([
            getRecentNotices(50).catch(() => []),
            getAssignmentsByTeacher(userId).catch(() => []),
            fetchNotificationsGlobalPaged(20, 0).then(r => r.data || []).catch(() => []),
          ]);
          const items = [];
          for (const n of notices || []) {
            items.push({ id: `notice_${n.notice_id}`, type: "notice", message: `Notice: ${n.title}`, date: n.created_at });
          }
          const dueSoonThreshold = new Date();
          dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 7);
          for (const a of teacherAssignments || []) {
            // upcoming due item
            if (a.due_date && new Date(a.due_date) <= dueSoonThreshold) {
              items.push({ id: `assign_due_${a.id}` , type: "assignment", message: `Assignment due soon: ${a.title} (${a.subject?.name || "Subject"}) on ${new Date(a.due_date).toLocaleString()}`, date: a.due_date });
            }
            // submission items
            try {
              const subs = await fetchAssignmentSubmissions(a.id);
              for (const s of subs || []) {
                items.push({ id: `sub_${s.id}`, type: "submission", message: `New submission for ${a.title} by ${s.student?.first_name ? `${s.student.first_name} ${s.student.last_name || ""}`.trim() : (s.student?.reg_no || "student")}` , date: s.submitted_at || s.created_at || a.created_at });
              }
            } catch {}
          }
          // Global notifications (from notifications table, actor null)
          for (const g of globalPage || []) {
            items.push({ id: `global_${g.id || g.date}`, type: g.type || "notice", message: g.message, date: g.date });
          }
          items.sort((a, b) => new Date(b.date) - new Date(a.date));
          setNotifications(items.slice(0, PAGE_SIZE));
          setOffset(PAGE_SIZE);
          setHasMore(items.length > PAGE_SIZE);
          window.__roleItemsCache = items;
        }
      } catch {
        setNotifications([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotifDropdown, role, userId]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      if (role === "admin") {
        const { data, error } = await fetchNotificationsPaged(PAGE_SIZE, offset);
        if (!error) {
          const next = data || [];
          setNotifications((prev) => [...prev, ...next]);
          setOffset(offset + next.length);
          setHasMore(next.length === PAGE_SIZE);
        }
      } else {
        const all = window.__roleItemsCache || [];
        const next = all.slice(offset, offset + PAGE_SIZE);
        setNotifications((prev) => [...prev, ...next]);
        setOffset(offset + next.length);
        setHasMore(all.length > offset + next.length);
      }
    } catch {
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

  // Background polling to update unread/new badge even when modal is closed
  useEffect(() => {
    let timer;
    const computeBadge = async () => {
      try {
        let firstPage = [];
        if (role === "admin") {
          const { data } = await fetchNotificationsPaged(10, 0);
          firstPage = data || [];
        } else if (role === "student" && userId) {
          const now = new Date();
          const fromDate = new Date();
          fromDate.setDate(now.getDate() - 7);
          const [notices, assignments, attendance, globalPage] = await Promise.all([
            getRecentNotices(20).catch(() => []),
            getAssignmentsForStudent(userId, fromDate.toISOString()).catch(() => []),
            getAttendanceByStudent(userId, fromDate.toISOString(), now.toISOString()).catch(() => []),
            fetchNotificationsGlobalPaged(10, 0).then(r => r.data || []).catch(() => []),
          ]);
          const items = [];
          for (const n of notices || []) {
            items.push({ id: `notice_${n.notice_id}`, date: n.created_at, type: "notice", message: n.title });
          }
          for (const a of assignments || []) {
            items.push({ id: `assign_${a.id}`, date: a.due_date, type: "assignment", message: a.title });
          }
          for (const att of attendance || []) {
            items.push({ id: `att_${att.id}`, date: att.date, type: "attendance", message: att.status });
          }
          for (const g of globalPage || []) {
            items.push({ id: `global_${g.id || g.date}`, date: g.date, type: g.type || "notice", message: g.message });
          }
          items.sort((a, b) => new Date(b.date) - new Date(a.date));
          firstPage = items.slice(0, 10);
        } else if (role === "teacher" && userId) {
          const now = new Date();
          const [notices, teacherAssignments, globalPage] = await Promise.all([
            getRecentNotices(20).catch(() => []),
            getAssignmentsByTeacher(userId).catch(() => []),
            fetchNotificationsGlobalPaged(10, 0).then(r => r.data || []).catch(() => []),
          ]);
          const items = [];
          for (const n of notices || []) {
            items.push({ id: `notice_${n.notice_id}`, date: n.created_at, type: "notice", message: n.title });
          }
          const dueSoonThreshold = new Date();
          dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 7);
          for (const a of teacherAssignments || []) {
            if (a.due_date && new Date(a.due_date) <= dueSoonThreshold) {
              items.push({ id: `assign_due_${a.id}`, date: a.due_date, type: "assignment", message: a.title });
            }
            try {
              const subs = await fetchAssignmentSubmissions(a.id);
              for (const s of subs || []) {
                items.push({ id: `sub_${s.id}`, date: s.submitted_at || s.created_at || a.created_at, type: "submission", message: a.title });
              }
            } catch {}
          }
          for (const g of globalPage || []) {
            items.push({ id: `global_${g.id || g.date}`, date: g.date, type: g.type || "notice", message: g.message });
          }
          items.sort((a, b) => new Date(b.date) - new Date(a.date));
          firstPage = items.slice(0, 10);
        }
        const count = firstPage.reduce((acc, n) => (n.id && !readIds.has(n.id) ? acc + 1 : acc), 0);
        setBadgeUnreadCount(count);
      } catch {
        // ignore badge errors
      }
    };
    computeBadge();
    timer = setInterval(computeBadge, 30000);
    return () => timer && clearInterval(timer);
  }, [role, userId, readIds]);

  const getUserDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return [profile.first_name, profile.last_name].filter(Boolean).join(" ");
    }
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name;
    return user?.email?.split("@")?.[0] || "User";
  };

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

      <h1 className="text-xl font-semibold">Welcome back, {getUserDisplayName()}!</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="relative inline-block">
            <FaBell
              className="text-white text-lg cursor-pointer hover:text-blue-200 transition"
              onClick={() => setShowNotifDropdown((prev) => !prev)}
            />
            {(badgeUnreadCount > 0 || unreadCount > 0) && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {badgeUnreadCount || unreadCount}
              </span>
            )}
          </div>
          {showNotifDropdown && (
            <div
              className="absolute right-0  w-80 bg-white rounded-md shadow-lg  z-50 max-h-96 overflow-y-auto scrollbar-hidden"
            >
              <div className="px-4 py-2 text-lg font-semibold bg-[#1E449D] text-white rounded-t-md flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center gap-3">
                  <button onClick={markAllAsUnread} className="text-xs text-white hover:underline">Mark all unread</button>
                  <button onClick={markAllAsRead} className="text-xs text-white hover:underline">Mark all read</button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-4 text-gray-500">No notifications.</div>
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
                          className={`px-4 py-2 border-b last:border-b-0 ${
                            typeBgClass[notif.type] || typeBgClass.default
                          } ${isUnread ? "bg-opacity-90" : "opacity-100"}`}
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
              {(() => {
                const getLastUrl = (val) => {
                  if (!val) return "";
                  if (Array.isArray(val)) return val.length > 0 ? val[val.length - 1] : "";
                  if (typeof val === "string") return val;
                  return "";
                };
                const profileImg = getLastUrl(profile?.profile_pic);
                return profileImg ? (
                  <img src={profileImg} alt="Profile" className="h-10 w-10 rounded-full object-cover border border-white" />
                ) : (
                  <FaCircleUser className="text-4xl text-gray-950" />
                );
              })()}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <p className="font-medium">{getUserDisplayName()}</p>
                <p className="text-gray-500 capitalize">{role}</p>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  if (role === "student") navigate("/student/profile");
                  else if (role === "teacher") navigate("/teacher/profile");
                  else navigate("/admin/profile");
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={async () => {
                  await handleSignOut();
                }}
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

export default AppHeader;
