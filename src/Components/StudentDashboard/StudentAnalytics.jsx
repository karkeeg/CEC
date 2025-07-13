import React from "react";
import { FaSearch, FaRegChartBar } from "react-icons/fa";
import { MdFeedback } from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const lineData = [
  { name: "Jan", math: 80, physics: 60, english: 50 },
  { name: "Feb", math: 70, physics: 65, english: 55 },
  { name: "Mar", math: 60, physics: 70, english: 60 },
  { name: "Apr", math: 65, physics: 80, english: 65 },
  { name: "May", math: 75, physics: 90, english: 70 },
  { name: "Jun", math: 90, physics: 85, english: 75 },
  { name: "Jul", math: 95, physics: 80, english: 80 },
  { name: "Aug", math: 85, physics: 75, english: 85 },
  { name: "Sep", math: 80, physics: 70, english: 90 },
];

const barData = [
  { course: "Math", marks: 10, extra: 5 },
  { course: "Physics", marks: 15, extra: 18 },
  { course: "English", marks: 12, extra: 7 },
  { course: "C program", marks: 11, extra: 6 },
  { course: "Statics", marks: 13, extra: 7 },
  { course: "Java", marks: 10, extra: 15 },
];

const StudentAnalytics = () => {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 tracking-tight drop-shadow-sm">
        Student Analytics Dashboard
      </h1>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center bg-[#30B0C733] rounded px-4 py-2 w-80">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-black flex-1 placeholder-black"
          />
          <FaSearch className="text-black ml-2" />
        </div>
        <button className="flex items-center gap-2 bg-teal-500 text-white px-6 py-2 rounded font-semibold hover:bg-teal-600 transition">
          View feedback <MdFeedback />
        </button>
      </div>

      {/* Grades Section */}
      <div className="mb-12">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Your Grades</h3>
        <div className="bg-[#0080ff] rounded-md p-6 flex flex-col items-center">
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3399ff" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="math"
                  stroke="#fff"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="physics"
                  stroke="#00e6e6"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="english"
                  stroke="#b266ff"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course-wise Performance Section */}
      <div className="bg-[#0099ff] rounded-md p-6 mt-8">
        <div className="flex items-center mb-4">
          <FaRegChartBar className="text-2xl mr-2" />
          <h3 className="text-xl font-bold text-gray-800">
            Course-wise Performance
          </h3>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" stroke="#000" />
              <YAxis stroke="#000" />
              <Tooltip />
              <Legend />
              <Bar dataKey="marks" fill="#1de9b6" />
              <Bar dataKey="extra" fill="#ff1744" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
