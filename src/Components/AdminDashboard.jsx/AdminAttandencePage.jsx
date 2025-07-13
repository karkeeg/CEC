import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
import html2pdf from "html2pdf.js";

const AdminAttandancePage = () => {
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-01-01");
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, [fromDate, toDate]);

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", fromDate)
      .lte("date", toDate);

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setData(data);
    }
  };

  const exportToPDF = () => {
    const element = document.getElementById("attendance-table");
    html2pdf().from(element).save("attendance-report.pdf");
  };

  const groupedBySemester = data.reduce((acc, row) => {
    if (!acc[row.semester]) {
      acc[row.semester] = {
        semester: row.semester,
        total_student: 0,
        present: 0,
        absent: 0,
      };
    }
    acc[row.semester].total_student += row.total_student;
    acc[row.semester].present += row.present;
    acc[row.semester].absent += row.absent;
    return acc;
  }, {});

  const tableData = Object.values(groupedBySemester);

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📅 Attendance
        </h1>
        <button
          onClick={exportToPDF}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Export pdf
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-4 mb-8">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border px-4 py-2 rounded bg-blue-500 text-white"
        />
        <span className="text-xl">-</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border px-4 py-2 rounded bg-blue-500 text-white"
        />
      </div>

      <h2 className="text-xl font-bold mb-4">Class-wise Stats</h2>

      <div className="overflow-x-auto border rounded" id="attendance-table">
        <table className="min-w-full text-center border-collapse">
          <thead className="bg-cyan-900 text-white">
            <tr>
              <th className="p-3 border">Semester</th>
              <th className="p-3 border">Total Student</th>
              <th className="p-3 border">Present</th>
              <th className="p-3 border">Absent</th>
              <th className="p-3 border">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              tableData.map((row, idx) => {
                const percent =
                  row.total_student > 0
                    ? Math.round((row.present / row.total_student) * 100)
                    : 0;

                return (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-blue-100" : "bg-purple-200"
                    }`}
                  >
                    <td className="p-3 border">{row.semester}</td>
                    <td className="p-3 border">{row.total_student}</td>
                    <td className="p-3 border">{row.present}</td>
                    <td className="p-3 border">{row.absent}</td>
                    <td className="p-3 border">{percent}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAttandancePage;
