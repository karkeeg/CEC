import React from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  Legend,
} from "recharts";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Mock data
const studentPerformanceData = [
  { month: "Jan", marks: 20 },
  { month: "Feb", marks: 35 },
  { month: "Mar", marks: 40 },
  { month: "Apr", marks: 60 },
  { month: "May", marks: 65 },
  { month: "Jun", marks: 65 },
  { month: "Jul", marks: 60 },
  { month: "Aug", marks: 55 },
  { month: "Sep", marks: 70 },
  { month: "Oct", marks: 80 },
];

const gradeTrendsData = [
  { course: "Math", A: 40, B: 30 },
  { course: "C programming", A: 30, B: 20 },
  { course: "English", A: 75, B: 60 },
  { course: "Statistics", A: 77, B: 30 },
];

const courseWiseData = [
  { course: "Math", days: 50 },
  { course: "C", days: 90 },
  { course: "English", days: 45 },
  { course: "Statistics", days: 65 },
  { course: "Statistics", days: 30 },
  { course: "Statistics", days: 75 },
  { course: "Statistics", days: 55 },
];
const AdminAnalytics = () => {
  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Analytics Report", 40, 40);
    // Student Performance
    doc.setFontSize(14);
    doc.text("Student Performance", 40, 70);
    autoTable(doc, {
      startY: 80,
      head: [["Month", "Marks"]],
      body: studentPerformanceData.map((row) => [row.month, row.marks]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    // Grade Trends
    let startY = doc.lastAutoTable.finalY + 20;
    doc.text("Grade Trends", 40, startY);
    autoTable(doc, {
      startY: startY + 10,
      head: [["Course", "A", "B"]],
      body: gradeTrendsData.map((row) => [row.course, row.A, row.B]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    // Course-wise Reports
    startY = doc.lastAutoTable.finalY + 20;
    doc.text("Course-wise Reports", 40, startY);
    autoTable(doc, {
      startY: startY + 10,
      head: [["Course", "Days"]],
      body: courseWiseData.map((row) => [row.course, row.days]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    doc.save("analytics-report.pdf");
  };
  return (
    <div className="min-h-screen border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-2xl font-extrabold text-gray-800 flex items-center">
          <span className="mr-2">📊</span> Analytics
        </span>
        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-auto"
        >
          Export PDF
        </button>
        <div className="ml-2 flex gap-3">
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
        id="analytics-table"
      >
        {/* Student Performance */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📈</span>
            <span className="font-bold text-xl">Student Performance</span>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart
                data={studentPerformanceData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="marks"
                  stroke="#1b3e94"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Grade Trends */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🗂️</span>
            <span className="font-bold text-xl">Grade Trends</span>
            <span className="ml-auto text-gray-400 text-lg">^</span>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart
                data={gradeTrendsData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="A" fill="#1b3e94" />
                <Bar dataKey="B" fill="#60a5fa" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Course-wise Reports */}
        <div className="bg-[#e8ebfc] rounded-xl p-6 shadow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">��</span>
            <span className="font-bold text-xl">Course-wise Reports</span>
          </div>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart
                data={courseWiseData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="days" fill="#60a5fa" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
