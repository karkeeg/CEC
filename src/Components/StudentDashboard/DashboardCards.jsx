import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaBook, FaBell, FaChartBar } from "react-icons/fa";
import { MdExpandLess } from "react-icons/md";
import { useUser } from "../../contexts/UserContext";
import supabase from "../../supabaseConfig/supabaseClient";

const classSchedule = [
  { subject: "English", time: "6:30 - 8:00" },
  { subject: "Mathematics", time: "8:00 - 9:30" },
  { subject: "Social", time: "9:30 - 10:00" },
  { subject: "Break Time", time: "10:00 - 10:30" },
  { subject: "Physics", time: "10:30 - 12:00" },
  { subject: "Chemistry", time: "12:00 - 01:30" },
  { subject: "C programming", time: "1:30 - 3:00" },
];

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

  useEffect(() => {
    if (!user) return;
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      const today = new Date().toISOString().split("T")[0];

      // Get all class_ids for this student
      const { data: studentClasses, error: scError } = await supabase
        .from("student_classes")
        .select("class_id")
        .eq("student_id", user.id);

      let classIds = [];
      if (!scError && studentClasses) {
        classIds = studentClasses.map((sc) => sc.class_id);
      }

      let query = supabase
        .from("assignments")
        .select(`id, title, due_date, subject:subject_id (name), class_id`)
        .gte("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5);

      if (classIds.length > 0) {
        query = query.in("class_id", classIds);
      } else {
        setAssignments([]);
        setLoadingAssignments(false);
        return;
      }

      try {
        const { data, error } = await query;
        if (error) {
          console.error("Error fetching assignments for dashboard:", error);
          setAssignments([]);
        } else if (data) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
      } catch (err) {
        console.error("Exception fetching assignments for dashboard:", err);
        setAssignments([]);
      }
      setLoadingAssignments(false);
    };
    fetchAssignments();
  }, [user]);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoadingNotices(true);
      const { data, error } = await supabase
        .from("notices")
        .select("title, description, created_at, notice_id")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!error && data) {
        setNotices(data);
      } else {
        setNotices([]);
      }
      setLoadingNotices(false);
    };
    fetchNotices();
  }, []);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Class Schedule */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800 ">
          See Your Dashboard {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today.
        </p>
      </div>
      <div className="bg-blue-100  rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaCalendarAlt /> Class Schedule
          </h2>
          <MdExpandLess />
        </div>
        <div className="flex flex-wrap gap-3">
          {classSchedule.map((cls, idx) => (
            <div
              key={idx}
              className="bg-white px-4 py-2 rounded-lg border border-blue-300 text-center shadow text-sm"
            >
              <div className="font-bold">{cls.subject}</div>
              <div className="text-xs text-gray-500">{cls.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment and Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upcoming Assignments */}
        <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-white rounded-2xl p-8 shadow-lg min-h-[260px] flex flex-col">
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
        <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-white rounded-2xl p-8 shadow-lg min-h-[260px] flex flex-col">
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
      <div className="bg-gradient-to-br from-green-100 via-blue-50 to-white rounded-2xl p-8 shadow-lg flex flex-col items-start min-h-[180px] mt-2">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-green-900">
          <FaChartBar /> Attendance Summary
        </h2>
        <div className="w-full flex flex-col gap-4">
          {/* Placeholder for future chart or stats */}
          <div className="w-full h-6 bg-white/70 rounded-full shadow-inner border border-green-100 flex items-center overflow-hidden">
            {/* Example: attendance bar (static for now) */}
            <div
              className="bg-green-400 h-full rounded-l-full"
              style={{ width: "75%" }}
            />
            <div className="bg-red-200 h-full" style={{ width: "25%" }} />
          </div>
          <div className="flex justify-between w-full text-sm font-medium mt-1">
            <span className="text-green-700">Present: 75%</span>
            <span className="text-red-500">Absent: 25%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
