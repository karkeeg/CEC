import React, { useEffect, useState } from "react";
import { getAllAssignments } from "../../supabaseConfig/supabaseApi";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useUser } from "../../contexts/UserContext";
import Loader from "../Loader";

const AdminAssignmentsPage = () => {
  const { user, role } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-01-01");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAllAssignments();
    // Frontend filtering based on role
    let filtered = data;
    if (role === "teacher") {
      filtered = data.filter(
        (a) => a.teacher_id === user.id || a.teacher_id === user.username
      );
    } else if (role === "student") {
      filtered = data.filter(
        (a) => a.year === user.year || a.class_id === user.class_id
      );
    }
    setAssignments(filtered);
    setLoading(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let startY = 40;
    doc.setFontSize(18);
    doc.text("Assignments Report", 40, startY);
    startY += 20;
    Object.entries(groupedByYear).forEach(([year, yearAssignments], idx) => {
      doc.setFontSize(14);
      doc.text(`Year: ${year}`, 40, startY);
      startY += 10;
      autoTable(doc, {
        startY,
        head: [["Assignment", "Teacher", "Submission Rate %"]],
        body: yearAssignments.map((row) => [
          row.title,
          row.teacher_id,
          row.submission_rate || "N/A",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [30, 108, 123],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 40, right: 40 },
      });
      startY = doc.lastAutoTable.finalY + 30;
    });
    doc.save("assignments-report.pdf");
  };

  // Group assignments by year
  const groupedByYear = assignments.reduce((acc, row) => {
    const year = row.year || "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(row);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading assignments data..." />
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📘 Assignment
        </h1>
        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4">Assignments Grouped by Year</h2>
      <div id="assignments-table" className="pdf-export">
        {Object.keys(groupedByYear).length === 0 ? (
          <div className="py-4 text-gray-500">No assignments found</div>
        ) : (
          Object.entries(groupedByYear).map(([year, yearAssignments]) => (
            <div key={year} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Year: {year}</h3>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-center border-collapse">
                  <thead className="bg-cyan-900 text-white">
                    <tr>
                      <th className="p-3 border">Assignment</th>
                      <th className="p-3 border">Teacher</th>
                      <th className="p-3 border">Submission Rate %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearAssignments.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`${
                          idx % 2 === 0 ? "bg-blue-100" : "bg-purple-200"
                        }`}
                      >
                        <td className="p-3 border">{row.title}</td>
                        <td className="p-3 border">{row.teacher_id}</td>
                        <td className="p-3 border">
                          {row.submission_rate || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAssignmentsPage;
