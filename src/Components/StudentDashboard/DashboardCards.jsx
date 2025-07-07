import React from "react";
import { FaCalendarAlt, FaBook, FaBell, FaChartBar } from "react-icons/fa";
import { MdExpandLess } from "react-icons/md";

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

const notices = [
  { type: "Exam Notice", date: "02-08-2025", time: "12:00pm", level: "danger" },
  { type: "Exam Notice", date: "02-08-2025", time: "12:00pm", level: "danger" },
  { type: "Exam Notice", date: "02-08-2025", time: "12:00pm", level: "danger" },
  {
    type: "Hw deadline",
    date: "02-08-2025",
    time: "12:00pm",
    level: "warning",
  },
  {
    type: "New library rules",
    date: "02-08-2025",
    time: "12:00pm",
    level: "info",
  },
  { type: "Due pending", date: "02-08-2025", time: "12:00pm", level: "info" },
  {
    type: "Holiday notice",
    date: "02-08-2025",
    time: "12:00pm",
    level: "info",
  },
];

const attendance = [
  { month: "Jan", present: 10, absent: 5 },
  { month: "Feb", present: 12, absent: 18 },
  { month: "Mar", present: 9, absent: 10 },
  { month: "Apr", present: 8, absent: 8 },
  { month: "May", present: 9, absent: 8 },
  { month: "Jun", present: 7, absent: 8 },
  { month: "Jul", present: 11, absent: 16 },
  { month: "Aug", present: 8, absent: 8 },
  { month: "Sep", present: 10, absent: 6 },
  { month: "Oct", present: 9, absent: 4 },
];

const DashboardCards = () => {
  return (
    <div className="ml-64 space-y-6 mb-10">
      {/* Class Schedule */}
      <div className="bg-blue-100 rounded-xl p-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaBook /> Upcoming Assignments
            </h2>
            <MdExpandLess />
          </div>
          {assignments.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 border-b last:border-none"
            >
              <span className="text-sm">{item.subject}</span>
              <span className="text-xs text-gray-500">
                {item.date} • {item.time}
              </span>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="bg-pink-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaBell /> Notice
            </h2>
            <MdExpandLess />
          </div>
          {notices.map((note, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 border-b last:border-none"
            >
              <span
                className={`text-sm flex items-center gap-2 ${
                  note.level === "danger"
                    ? "text-red-600"
                    : note.level === "warning"
                    ? "text-yellow-600"
                    : "text-gray-700"
                }`}
              >
                {note.level === "danger" && "⚠️"}
                {note.level === "warning" && "🟠"}
                {note.level === "info" && "📌"}
                {note.type}
              </span>
              <span className="text-xs text-gray-500">
                {note.date} • {note.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-blue-500 text-white rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <FaChartBar /> Attendance Summary
        </h2>
        <div className="flex gap-4 h-40">Summary to be added</div>
      </div>
    </div>
  );
};

export default DashboardCards;
