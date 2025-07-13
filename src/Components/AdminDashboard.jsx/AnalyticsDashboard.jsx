import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { MdCalendarToday } from "react-icons/md";
import { format } from "date-fns";

const courses = ["All", "Math", "C programming", "English", "Statistics"];
const semesters = ["Semester 1", "Semester 2", "Semester 3"];

const AnalyticsDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // Sample Data
  const lineData = [
    { month: "Jan", score: 20 },
    { month: "Feb", score: 30 },
    { month: "Mar", score: 45 },
    { month: "Apr", score: 60 },
    { month: "May", score: 60 },
    { month: "Jun", score: 50 },
    { month: "Jul", score: 60 },
    { month: "Aug", score: 75 },
    { month: "Sep", score: 90 },
  ];

  const barData = [
    { subject: "Math", student: 30, average: 50 },
    { subject: "C programming", student: 80, average: 60 },
    { subject: "English", student: 40, average: 55 },
    { subject: "Statistics", student: 50, average: 45 },
  ];

  const attendanceGrid = [
    ["S", "M", "T", "W", "T", "F"],
    ...Array(5)
      .fill(0)
      .map((_, i) =>
        Array(6)
          .fill(0)
          .map(
            () =>
              ["present", "absent", "holiday"][Math.floor(Math.random() * 3)]
          )
      ),
  ];

  const getColor = (status) => {
    switch (status) {
      case "present":
        return "#B8E986";
      case "absent":
        return "#FBC7C7";
      case "holiday":
        return "#BFD8F7";
      default:
        return "#eee";
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-500 p-6">
      <h1 className="font-bold text-3xl p-2">Analytical Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-end mb-6">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 bg-[#1F4EB4] text-white rounded shadow"
        >
          {courses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center bg-[#1F4EB4] text-white px-4 py-2 rounded shadow">
          <MdCalendarToday className="mr-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent outline-none"
          />
        </div>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="px-4 py-2 bg-teal-600 text-white rounded shadow"
        >
          {semesters.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Performance */}
        <div className="bg-[#EEF0FD] text-black p-4 rounded">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            📈 Student Performance
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1F4EB4"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Trends */}
        <div className="bg-[#EEF0FD] text-black p-4 rounded">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            📊 Grade Trends
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="student" fill="#1F4EB4" />
              <Bar dataKey="average" fill="#6FCF97" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course-wise Report */}
        <div className="bg-[#EEF0FD] text-black p-4 rounded">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            📑 Course-wise Reports
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="student" fill="#1F4EB4" />
              <Bar dataKey="average" fill="#6FCF97" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Heatmap */}
        <div className="bg-[#EEF0FD] text-black p-4 rounded">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            📅 Attendance Heatmap
          </h2>
          <div className="grid grid-cols-6 gap-1 text-sm">
            {attendanceGrid.flat().map((status, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded"
                style={{ backgroundColor: getColor(status) }}
                title={status}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-700">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#B8E986] rounded" /> Present
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#FBC7C7] rounded" /> Absent
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#BFD8F7] rounded" /> Public Holiday
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
