import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

      const { data, error } = await supabase
        .from("departments")
        .select(`id, name, faculty:faculty_id(id,name)`);

      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data);
      }

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

  return (
    <div className="bg-white ml-64 p-6">
      <h1 className="text-2xl font-bold mb-4">Departments</h1>

      <input
        type="text"
        placeholder="Search department..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded-md w-full max-w-md"
      />
      {/* Table  */}
      <div className="mt-10 overflow-x-auto">
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
