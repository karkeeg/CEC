import React, { useEffect, useState } from "react";
import { getAllDepartments } from "../../supabaseConfig/supabaseApi";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#E74C3C",
];

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      const data = await getAllDepartments();
      setDepartments(data);
      setLoading(false);
    };
    fetchDepartments();
  }, []);

  const filtered = departments.filter((dept) =>
    `${dept.name} ${dept.faculty.name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const facultyCounts = filtered.reduce((acc, dept) => {
    const facultyName = dept.faculty.name;
    acc[facultyName] = (acc[facultyName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(facultyCounts).map(([faculty, count]) => ({
    faculty,
    count,
  }));

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Departments Report", 40, 40);
    autoTable(doc, {
      startY: 60,
      head: [["Department ID", "Name", "Faculty"]],
      body: filtered
        .slice(0, visibleCount)
        .map((dept) => [dept.id, dept.name, dept.faculty.name]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    doc.save("departments-report.pdf");
  };

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Departments</h1>
        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>

      <input
        type="text"
        placeholder="Search department..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded-md w-full max-w-md"
      />
      {/* Table  */}
      <div className="mt-10 overflow-x-auto" id="departments-table">
        {loading ? (
          <p>Loading departments...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No departments found.</p>
        ) : (
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Department ID</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Faculty</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visibleCount).map((dept, idx) => (
                <tr key={idx} className="text-center border-t">
                  <td className="px-4 py-2">{dept.id}</td>
                  <td className="px-4 py-2">{dept.name}</td>
                  <td className="px-4 py-2">{dept.faculty.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > visibleCount && (
          <div className="text-center mb-4 mt-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* Pie chart with custom legend side-by-side */}
      <div className="flex  mt-4  bg-gray-100 flex-col md:flex-row gap-8 items-center">
        {/* Pie Chart */}
        <div className="md:w-1/2 mb-14 w-full h-72">
          {chartData.length === 0 ? (
            <p>No data to display.</p>
          ) : (
            <>
              <h2 className="text-center mt-4 mb-6 text-2xl font-bold text-gray-400">
                Pie Charts
              </h2>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="faculty"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Custom Legend */}
        <div className="md:w-1/2 w-full">
          <h2 className="text-xl font-semibold mb-4">Faculty Colors</h2>
          <ul className="space-y-2">
            {chartData.map((entry, index) => (
              <li key={entry.faculty} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="text-lg">{entry.faculty}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
