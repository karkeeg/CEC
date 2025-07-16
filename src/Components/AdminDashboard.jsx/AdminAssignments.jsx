import React, { useEffect, useState } from "react";
import { getAllAssignments } from "../../supabaseConfig/supabaseApi";
import html2pdf from "html2pdf.js";

const AdminAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-01-01");

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    const data = await getAllAssignments();
    setAssignments(data);
  };

  const exportToPDF = () => {
    const element = document.getElementById("assignment-table");
    html2pdf().from(element).save("assignment-report.pdf");
  };

  const grouped = assignments.reduce((acc, row) => {
    if (!acc[row.semester]) {
      acc[row.semester] = {
        semester: row.semester,
        assignment: 0,
        submission_rate: row.submission_rate,
      };
    }
    acc[row.semester].assignment += row.assignment_count;
    return acc;
  }, {});

  const tableData = Object.values(grouped);

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📘 Assignment
        </h1>
        <button
          onClick={exportToPDF}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Export pdf
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Class-wise Stats</h2>

      <div id="assignment-table" className="overflow-x-auto border rounded">
        <table className="min-w-full text-center border-collapse">
          <thead className="bg-cyan-900 text-white">
            <tr>
              <th className="p-3 border">Semester</th>
              <th className="p-3 border">Assignment</th>
              <th className="p-3 border">Submission Rate %</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-4 text-gray-500">
                  No assignments found
                </td>
              </tr>
            ) : (
              tableData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0 ? "bg-blue-100" : "bg-purple-200"
                  }`}
                >
                  <td className="p-3 border">{row.semester}</td>
                  <td className="p-3 border">{row.assignment}</td>
                  <td className="p-3 border">{row.submission_rate || "92%"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAssignmentsPage;
