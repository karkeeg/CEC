import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaBook, FaBell, FaChartBar } from "react-icons/fa";
import { MdExpandLess } from "react-icons/md";
import { useUser } from "../../contexts/UserContext";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  getAssignmentsForStudent,
  getRecentNotices,
  getAllClasses,
  getAttendanceByStudent,
} from "../../supabaseConfig/supabaseApi";

const assignments = [
  { subject: "C programming", date: "02-07-2025", time: "12:00pm" },
  { subject: "Engineering Mathematics I", date: "28-07-2025", time: "12:00pm" },
  { subject: "Physics", date: "09-07-2025", time: "12:00pm" },
  { subject: "Nepali", date: "12-07-2025", time: "12:00pm" },
  { subject: "Nepali", date: "12-07-2025", time: "12:00pm" },
];

const DashboardCards = () => {
  const { user } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [classSchedule, setClassSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    total: 0,
  });
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      const today = new Date().toISOString().split("T")[0];
      const data = await getAssignmentsForStudent(user.id, today);
      setAssignments(data || []);
      setLoadingAssignments(false);
    };
    fetchAssignments();
  }, [user]);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoadingNotices(true);
      const data = await getRecentNotices(5);
      setNotices(data || []);
      setLoadingNotices(false);
    };
    fetchNotices();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchSchedule = async () => {
      setLoadingSchedule(true);
      // Get enrolled class IDs
      const { data: enrolled, error } = await supabase
        .from("student_classes")
        .select("class_id")
        .eq("student_id", user.id);
      if (error || !enrolled) {
        setClassSchedule([]);
        setLoadingSchedule(false);
        return;
      }
      const classIds = enrolled.map((sc) => sc.class_id);
      // Get all classes and filter
      const allClasses = await getAllClasses();
      const filtered = (allClasses || []).filter((cls) =>
        classIds.includes(cls.class_id || cls.id)
      );
      // Sort by schedule time if available
      filtered.sort((a, b) => {
        if (!a.schedule || !b.schedule) return 0;
        return a.schedule.localeCompare(b.schedule);
      });
      setClassSchedule(filtered);
      setLoadingSchedule(false);
    };
    fetchSchedule();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      // Fetch all attendance records for this student
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", user.id);
      if (error || !data) {
        setAttendanceSummary({ present: 0, absent: 0, total: 0 });
        setLoadingAttendance(false);
        return;
      }
      const present = data.filter((a) => a.status === "present").length;
      const absent = data.filter((a) => a.status === "absent").length;
      const total = data.length;
      setAttendanceSummary({ present, absent, total });
      setLoadingAttendance(false);
    };
    fetchAttendance();
  }, [user]);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="space-y-6 p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 w-full min-w-0">
      {/* Class Schedule */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800 ">
          See Your Dashboard {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today.
        </p>
      </div>
      <div className="bg-blue-100  rounded-xl p-3 sm:p-6 min-w-0 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaCalendarAlt /> Class Schedule
          </h2>
          <MdExpandLess />
        </div>
        <div className="flex flex-wrap gap-3">
          {loadingSchedule ? (
            <div className="text-gray-500 text-base">Loading schedule...</div>
          ) : classSchedule.length === 0 ? (
            <div className="text-gray-500 text-base">No classes found.</div>
          ) : (
            classSchedule.map((cls, idx) => (
              <div
                key={idx}
                className="bg-white px-4 py-2 rounded-lg border border-blue-300 text-center shadow text-sm"
              >
                <div className="font-bold">
                  {cls.subject?.name ?? "Unknown"}
                </div>
                <div className="text-xs text-gray-500">
                  {cls.schedule
                    ? `${new Date(cls.schedule).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })} | ${new Date(cls.schedule).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "No date/time"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assignment and Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 min-w-0">
        {/* Upcoming Assignments */}
        <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-white rounded-2xl p-3 sm:p-8 shadow-lg min-h-[260px] flex flex-col min-w-0 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-900">
              <FaBook /> Upcoming Assignments
            </h2>
            <MdExpandLess className="text-blue-400" />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {loadingAssignments ? (
              <div className="text-gray-500 text-base">
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-gray-500 text-base">
                No upcoming assignments.
              </div>
            ) : (
              assignments.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-white/80 rounded-lg px-5 py-3 shadow border border-blue-100 hover:shadow-md transition mb-1"
                >
                  <span className="text-base font-medium text-blue-900">
                    {item.subject?.name ?? "Unknown"}
                  </span>
                  <span className="text-sm text-gray-500 font-semibold">
                    {formatDate(item.due_date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-white rounded-2xl p-3 sm:p-8 shadow-lg min-h-[260px] flex flex-col min-w-0 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-pink-900">
              <FaBell /> Notice
            </h2>
            <MdExpandLess className="text-pink-400" />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {loadingNotices ? (
              <div className="text-gray-500 text-base">Loading notices...</div>
            ) : notices.length === 0 ? (
              <div className="text-gray-500 text-base">No notices found.</div>
            ) : (
              notices.map((note, idx) => (
                <div
                  key={note.notice_id}
                  className="flex justify-between items-center bg-white/80 rounded-lg px-5 py-3 shadow border border-pink-100 hover:shadow-md transition mb-1"
                >
                  <span className="text-base flex items-center gap-2 text-pink-900 font-medium">
                    📢 {note.title}
                  </span>
                  <span className="text-sm text-gray-500 font-semibold">
                    {formatDate(note.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-gradient-to-br from-green-100 via-blue-50 to-white rounded-2xl p-3 sm:p-8 shadow-lg flex flex-col items-start min-h-[180px] mt-2 min-w-0 overflow-x-auto">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-green-900">
          <FaChartBar /> Attendance Summary
        </h2>
        <div className="w-full flex flex-col gap-4">
          {loadingAttendance ? (
            <div className="text-gray-500 text-base">Loading attendance...</div>
          ) : attendanceSummary.total === 0 ? (
            <div className="text-gray-500 text-base">
              No attendance records found.
            </div>
          ) : (
            <>
              <div className="w-full h-6 bg-white/70 rounded-full shadow-inner border border-green-100 flex items-center overflow-hidden">
                <div
                  className="bg-green-400 h-full rounded-l-full"
                  style={{
                    width: `${
                      (attendanceSummary.present / attendanceSummary.total) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-red-200 h-full"
                  style={{
                    width: `${
                      (attendanceSummary.absent / attendanceSummary.total) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between w-full text-sm font-medium mt-1">
                <span className="text-green-700">
                  Present:{" "}
                  {Math.round(
                    (attendanceSummary.present / attendanceSummary.total) * 100
                  )}
                  %
                </span>
                <span className="text-red-500">
                  Absent:{" "}
                  {Math.round(
                    (attendanceSummary.absent / attendanceSummary.total) * 100
                  )}
                  %
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
