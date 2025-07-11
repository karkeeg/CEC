import React from "react";

// Placeholder chart components
const LineChart = () => (
  <div className="w-full h-48 bg-blue-100 rounded-lg flex items-center justify-center text-blue-400">
    Line Chart
  </div>
);
const BarChart = () => (
  <div className="w-full h-48 bg-blue-100 rounded-lg flex items-center justify-center text-blue-400">
    Bar Chart
  </div>
);
const Heatmap = () => (
  <div className="w-full h-48 bg-blue-100 rounded-lg flex items-center justify-center text-blue-400">
    Heatmap
  </div>
);

const AdminAnalytics = () => {
  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-2xl font-extrabold text-gray-800 flex items-center">
          <span className="mr-2">📊</span> Analytics
        </span>
        <div className="ml-auto flex gap-3">
          <select className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold focus:outline-none">
            <option>Courses</option>
          </select>
          <input
            type="date"
            className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold focus:outline-none"
            value="2025-01-01"
            readOnly
          />
          <select className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold focus:outline-none">
            <option>Semester</option>
          </select>
        </div>
      </div>
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student Performance */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📈</span>
            <span className="font-bold text-xl">Student Performance</span>
          </div>
          <LineChart />
        </div>
        {/* Grade Trends */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🗂️</span>
            <span className="font-bold text-xl">Grade Trends</span>
            <span className="ml-auto text-gray-400 text-lg">^</span>
          </div>
          <BarChart />
        </div>
        {/* Course-wise Reports */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📑</span>
            <span className="font-bold text-xl">Course-wise Reports</span>
          </div>
          <BarChart />
        </div>
        {/* Attendance Heatmap */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🗓️</span>
            <span className="font-bold text-xl">Attendance Heatmap</span>
            <span className="ml-auto text-gray-400 text-lg">^</span>
          </div>
          <Heatmap />
          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-200 inline-block rounded"></span>{" "}
              Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-red-200 inline-block rounded"></span>{" "}
              Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-yellow-200 inline-block rounded"></span>{" "}
              Public Holiday
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
