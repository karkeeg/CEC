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

  // Group attendance by class_id and calculate stats
  const groupedByClass = data.reduce((acc, row) => {
    const key = row.class_id || "Unknown";
    if (!acc[key]) {
      acc[key] = {
        class_id: key,
        total_student: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
    }
    acc[key].total_student += 1;
    if (row.status === "present") acc[key].present += 1;
    else if (row.status === "absent") acc[key].absent += 1;
    else if (row.status === "late") acc[key].late += 1;
    return acc;
  }, {});

  const tableData = Object.values(groupedByClass);

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          4c5 Attendance
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
              <th className="p-3 border">Class ID</th>
              <th className="p-3 border">Total Records</th>
              <th className="p-3 border">Present</th>
              <th className="p-3 border">Absent</th>
              <th className="p-3 border">Late</th>
              <th className="p-3 border">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-gray-500">
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
                    className={idx % 2 === 0 ? "bg-blue-100" : "bg-purple-200"}
                  >
                    <td className="p-3 border">{row.class_id}</td>
                    <td className="p-3 border">{row.total_student}</td>
                    <td className="p-3 border">{row.present}</td>
                    <td className="p-3 border">{row.absent}</td>
                    <td className="p-3 border">{row.late}</td>
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
