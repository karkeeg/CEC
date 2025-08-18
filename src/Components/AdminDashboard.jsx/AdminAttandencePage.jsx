import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  fetchClasses,
  fetchStudents,
  getAttendanceByDateRange,
} from "../../supabaseConfig/supabaseApi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import Loader from "../Loader";

const AdminAttandancePage = () => {
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return oneMonthAgo.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses().then(setClasses);
    fetchStudents().then(setStudents);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAttendanceByDateRange(fromDate, toDate)
      .then(setAttendance)
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    
    // Add header
    doc.setFontSize(24);
    doc.setTextColor(30, 68, 157); // Blue color
    doc.text("Attendance Report", 40, 40);
    
    // Add date range
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray color
    doc.text(`Date Range: ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`, 40, 60);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 75);
    
    let startY = 100;
    
    // Add overall statistics
    doc.setFontSize(16);
    doc.setTextColor(30, 68, 157);
    doc.text("Overall Statistics", 40, startY);
    startY += 20;
    
    const totalRecords = attendance.length;
    const present = attendance.filter((r) => r.status === "present").length;
    const absent = attendance.filter((r) => r.status === "absent").length;
    const late = attendance.filter((r) => r.status === "late").length;
    const overallAttendance = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Records: ${totalRecords}`, 40, startY);
    startY += 15;
    doc.text(`Present: ${present}`, 40, startY);
    startY += 15;
    doc.text(`Absent: ${absent}`, 40, startY);
    startY += 15;
    doc.text(`Late: ${late}`, 40, startY);
    startY += 15;
    doc.text(`Overall Attendance: ${overallAttendance}%`, 40, startY);
    startY += 30;
    
    // Add detailed attendance table
    doc.setFontSize(16);
    doc.setTextColor(30, 68, 157);
    doc.text("Class-wise Attendance Report", 40, startY);
    startY += 20;
    
    // Create table data for PDF (without action buttons)
    const tableData = classTableData.map((row) => {
      const percent = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
      return [
        classMap[row.class_id]?.name || row.class_id,
        row.total.toString(),
        row.present.toString(),
        row.absent.toString(),
        row.late.toString(),
        `${percent}%`
      ];
    });
    
    // Add table with improved formatting
    autoTable(doc, {
      startY,
      head: [["Class", "Total", "Present", "Absent", "Late", "Attendance %"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 68, 157],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 11,
        halign: 'center'
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 6,
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { 
          halign: 'left',
          fontStyle: 'bold',
          fontSize: 10
        },
        1: { 
          halign: 'center'
        },
        2: { 
          halign: 'center'
        },
        3: { 
          halign: 'center'
        },
        4: { 
          halign: 'center'
        },
        5: { 
          halign: 'center',
          fontStyle: 'bold'
        }
      },
      margin: { left: 40, right: 40 },
      didDrawPage: function (data) {
        // Add page number
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    // Save the PDF
    doc.save("attendance-report.pdf");
  };

  const classMap = Object.fromEntries(
    classes.map((cls) => [cls.class_id, cls])
  );
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  // Group attendance by class
  const groupedByClass = attendance.reduce((acc, row) => {
    const key = row.class_id || "Unknown";
    if (!acc[key]) {
      acc[key] = {
        class_id: key,
        records: [],
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
      };
    }
    acc[key].records.push(row);
    acc[key].total += 1;
    if (row.status === "present") acc[key].present += 1;
    else if (row.status === "absent") acc[key].absent += 1;
    else if (row.status === "late") acc[key].late += 1;
    return acc;
  }, {});
  const classTableData = Object.values(groupedByClass);

  // Analytics: Daily attendance % (all classes)
  const attendanceByDate = attendance.reduce((acc, row) => {
    if (!acc[row.date])
      acc[row.date] = {
        date: row.date,
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
      };
    acc[row.date].total += 1;
    if (row.status === "present") acc[row.date].present += 1;
    else if (row.status === "absent") acc[row.date].absent += 1;
    else if (row.status === "late") acc[row.date].late += 1;
    return acc;
  }, {});
  const attendanceBarData = Object.values(attendanceByDate)
    .map((d) => ({
      date: d.date,
      percent: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
      present: d.present,
      absent: d.absent,
      late: d.late,
      total: d.total,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Analytics: Pie chart for present/absent/late (all classes)
  const present = attendance.filter((r) => r.status === "present").length;
  const absent = attendance.filter((r) => r.status === "absent").length;
  const late = attendance.filter((r) => r.status === "late").length;
  const pieData = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    { name: "Late", value: late },
  ];
  const pieColors = ["#22c55e", "#ef4444", "#facc15"];

  // Calculate overall attendance percentage
  const totalRecords = attendance.length;
  const overallAttendance = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading attendance data..." />
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen min-w-0">
      <div className="max-w-7xl mx-auto min-w-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 min-w-0">
          <h1 className="text-3xl font-bold text-blue-900">Admin Attendance</h1>
          <button
            onClick={exportToPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Export PDF
          </button>
        </div>

        {/* Enhanced Date Range Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Date Range Filter</h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border px-4 py-2 rounded bg-white text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border px-4 py-2 rounded bg-white text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Showing data from <span className="font-medium">{new Date(fromDate).toLocaleDateString()}</span></p>
              <p>to <span className="font-medium">{new Date(toDate).toLocaleDateString()}</span></p>
            </div>
          </div>
        </div>

        {/* Overall Statistics Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Overall Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{present}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{absent}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{late}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{overallAttendance}%</div>
              <div className="text-sm text-gray-600">Overall Attendance</div>
            </div>
          </div>
        </div>

        {/* Improved Class Attendance Table */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Class-wise Attendance Report</h3>
            <p className="text-sm text-gray-600 mt-1">Overall Attendance: {overallAttendance}%</p>
          </div>
          <div className="overflow-x-auto" id="attendance-table">
            <table className="min-w-full">
              <thead className="bg-blue-900 border-b border-blue-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Total Records
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Attendance %
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classTableData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <p className="text-lg font-medium">No attendance data found</p>
                        <p className="text-sm">Try adjusting your date range or check if data exists for the selected period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classTableData.map((row, idx) => {
                    const percent = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
                    const getAttendanceColor = (percentage) => {
                      if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200';
                      if (percentage >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
                      if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      return 'bg-red-100 text-red-800 border-red-200';
                    };
                    
                    // Alternate row colors: light blue and light pink
                    const rowBgColor = idx % 2 === 0 ? 'bg-blue-50' : 'bg-pink-50';
                    
                    return (
                      <tr key={row.class_id} className={`${rowBgColor} hover:bg-gray-100 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {classMap[row.class_id]?.name || row.class_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {row.total}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {row.present}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {row.absent}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {row.late}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getAttendanceColor(percent)}`}>
                            {percent}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onClick={() => {
                              setSelectedClass(row);
                              setShowModal(true);
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section (now below table) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 min-w-0">
          {/* Bar Chart: Daily Attendance % */}
          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 shadow flex flex-col items-center min-w-0 overflow-x-auto">
            <h3 className="text-md font-semibold mb-2 text-blue-800">
              Daily Attendance %
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={attendanceBarData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis dataKey="date" fontSize={12} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => v + "%"}
                  fontSize={12}
                />
                <Tooltip formatter={(v) => v + "%"} />
                <Bar dataKey="percent" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Pie Chart: Present/Absent/Late */}
          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 shadow flex flex-col items-center min-w-0 overflow-x-auto">
            <h3 className="text-md font-semibold mb-2 text-blue-800">
              Attendance Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label
                >
                  {pieData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={pieColors[idx % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Analytics: Stacked Bar chart for present/absent/late per day */}
        {/* <div className="bg-blue-50 round/ed-xl p-3 sm:p-4 shadow flex flex-col items-center mb-6 min-w-0 overflow-x-auto">
          <h3 className="text-md font-semibold mb-2 text-blue-800">
            Daily Present/Absent/Late Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={attendanceBarData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="present"
                stackId="a"
                fill="#22c55e"
                name="Present"
              />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
              <Bar dataKey="late" stackId="a" fill="#facc15" name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {/* Modal for class details */}
        {showModal && selectedClass && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-3 sm:p-6 rounded shadow-lg w-full max-w-2xl relative min-w-0">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-2">
                Class:{" "}
                {classMap[selectedClass.class_id]?.name ||
                  selectedClass.class_id}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <div>
                  <strong>Total Records:</strong> {selectedClass.total}
                </div>
                <div>
                  <strong>Present:</strong> {selectedClass.present}
                </div>
                <div>
                  <strong>Absent:</strong> {selectedClass.absent}
                </div>
                <div>
                  <strong>Late:</strong> {selectedClass.late}
                </div>
                <div>
                  <strong>Attendance %:</strong>{" "}
                  {selectedClass.total > 0
                    ? Math.round(
                        (selectedClass.present / selectedClass.total) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 mt-4">
                Student Attendance
              </h3>
              <div className="w-full max-h-64 overflow-y-auto border rounded mb-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedClass.records.map((rec, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          {studentMap[rec.student_id]?.first_name}{" "}
                          {studentMap[rec.student_id]?.middle_name || ""}{" "}
                          {studentMap[rec.student_id]?.last_name || ""}
                        </td>
                        <td className="px-4 py-2">{rec.status}</td>
                        <td className="px-4 py-2">{rec.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttandancePage;
