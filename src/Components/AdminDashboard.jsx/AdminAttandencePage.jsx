import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
import html2pdf from "html2pdf.js";
import { fetchClasses, fetchStudents } from "../../supabaseConfig/supabaseApi";
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

const AdminAttandancePage = () => {
  const [fromDate, setFromDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
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

  useEffect(() => {
    fetchClasses().then(setClasses);
    fetchStudents().then(setStudents);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fromDate, toDate]);

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", fromDate)
      .lte("date", toDate);
    if (!error) setAttendance(data || []);
    else setAttendance([]);
  };

  const exportToPDF = () => {
    const element = document.getElementById("attendance-table");
    html2pdf().from(element).save("attendance-report.pdf");
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

  return (
    <div className="p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-900">Admin Attendance</h1>
          <button
            onClick={exportToPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Export PDF
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-4 py-2 rounded bg-white text-gray-800 w-full md:w-1/4"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-4 py-2 rounded bg-white text-gray-800 w-full md:w-1/4"
          />
        </div>

        {/* Class Attendance Table (moved above charts) */}
        <div
          className="overflow-x-auto border rounded bg-white mb-8"
          id="attendance-table"
        >
          <table className="min-w-full text-center border-collapse">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-3 border">Class</th>
                <th className="p-3 border">Total Records</th>
                <th className="p-3 border">Present</th>
                <th className="p-3 border">Absent</th>
                <th className="p-3 border">Late</th>
                <th className="p-3 border">Attendance %</th>
                <th className="p-3 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {classTableData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                classTableData.map((row, idx) => {
                  const percent =
                    row.total > 0
                      ? Math.round((row.present / row.total) * 100)
                      : 0;
                  return (
                    <tr
                      key={row.class_id}
                      className={idx % 2 === 0 ? "bg-blue-50" : "bg-purple-50"}
                    >
                      <td className="p-3 border font-semibold">
                        {classMap[row.class_id]?.name || row.class_id}
                      </td>
                      <td className="p-3 border">{row.total}</td>
                      <td className="p-3 border">{row.present}</td>
                      <td className="p-3 border">{row.absent}</td>
                      <td className="p-3 border">{row.late}</td>
                      <td className="p-3 border">{percent}%</td>
                      <td className="p-3 border">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                          onClick={() => {
                            setSelectedClass(row);
                            setShowModal(true);
                          }}
                        >
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

        {/* Charts Section (now below table) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart: Daily Attendance % */}
          <div className="bg-blue-50 rounded-xl p-4 shadow flex flex-col items-center">
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
          <div className="bg-blue-50 rounded-xl p-4 shadow flex flex-col items-center">
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

        {/* Additional Analytics: Line chart for daily total records */}
        <div className="bg-blue-50 rounded-xl p-4 shadow flex flex-col items-center mb-6">
          <h3 className="text-md font-semibold mb-2 text-blue-800">
            Daily Total Attendance Records
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={attendanceBarData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Analytics: Stacked Bar chart for present/absent/late per day */}
        <div className="bg-blue-50 rounded-xl p-4 shadow flex flex-col items-center mb-6">
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
        </div>

        {/* Modal for class details */}
        {showModal && selectedClass && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
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
