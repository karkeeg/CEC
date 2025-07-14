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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
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

// New: Attendance trend mock data
const attendanceData = [
  { month: "Jan", attendance: 92 },
  { month: "Feb", attendance: 88 },
  { month: "Mar", attendance: 95 },
  { month: "Apr", attendance: 90 },
  { month: "May", attendance: 97 },
  { month: "Jun", attendance: 93 },
  { month: "Jul", attendance: 89 },
  { month: "Aug", attendance: 94 },
  { month: "Sep", attendance: 91 },
];

// New: Assignment submission rate mock data
const assignmentSubmission = [
  { name: "Submitted", value: 22 },
  { name: "Missed", value: 3 },
];
const pieColors = ["#1de9b6", "#ff1744"];

// Mock data for class average comparison
const classAverageData = [
  { subject: "Math", student: 80, average: 75 },
  { subject: "Physics", student: 70, average: 72 },
  { subject: "English", student: 60, average: 65 },
  { subject: "C program", student: 68, average: 66 },
  { subject: "Statics", student: 73, average: 70 },
  { subject: "Java", student: 77, average: 74 },
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
        <div className="bg-blue-50 rounded-md p-6 flex flex-col items-center text-gray-800">
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3399ff" />
                <XAxis dataKey="name" stroke="#333" />
                <YAxis stroke="#333" />
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="math"
                  stroke="#333"
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
      <div className="bg-blue-100 rounded-md p-6 mt-8">
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

      {/* Attendance Trend Section */}
      <div className="bg-[#f5f7fa] rounded-md p-6 mt-8">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📈</span>
          <h3 className="text-xl font-bold text-gray-800">Attendance Trend</h3>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={attendanceData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorAttendance"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#1de9b6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1de9b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#000" />
              <YAxis
                stroke="#000"
                domain={[80, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#1de9b6"
                fillOpacity={1}
                fill="url(#colorAttendance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignment Submission Rate Section */}
      <div className="bg-[#f5f7fa] rounded-md p-6 mt-8">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📊</span>
          <h3 className="text-xl font-bold text-gray-800">
            Assignment Submission Rate
          </h3>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assignmentSubmission}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {assignmentSubmission.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={pieColors[idx % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
            <h4 className="text-lg font-semibold mb-2">Summary</h4>
            <ul className="text-gray-700">
              <li>
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ background: pieColors[0] }}
                />
                Submitted: {assignmentSubmission[0].value}
              </li>
              <li>
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ background: pieColors[1] }}
                />
                Missed: {assignmentSubmission[1].value}
              </li>
              <li className="mt-2 font-bold">
                Submission Rate:{" "}
                {Math.round(
                  (assignmentSubmission[0].value /
                    (assignmentSubmission[0].value +
                      assignmentSubmission[1].value)) *
                    100
                )}
                %
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison to Class Average Section */}
      <div className="bg-blue-50 rounded-md p-6 mt-8">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📚</span>
          <h3 className="text-xl font-bold text-gray-800">
            Comparison to Class Average
          </h3>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classAverageData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" stroke="#000" />
              <YAxis stroke="#000" />
              <Tooltip />
              <Legend />
              <Bar dataKey="student" fill="#1de9b6" name="You" />
              <Bar dataKey="average" fill="#3399ff" name="Class Avg" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
