import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaTrash } from "react-icons/fa";

const StudentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearChartData, setYearChartData] = useState([]);
  const [genderChartData, setGenderChartData] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase.from("students").select("*");
    if (!error && data) {
      setStudents(data);
      prepareCharts(data);
    }
  };

  const prepareCharts = (data) => {
    // Year Chart
    const yearGroups = data.reduce((acc, student) => {
      acc[student.year] = (acc[student.year] || 0) + 1;
      return acc;
    }, {});
    setYearChartData(
      Object.entries(yearGroups).map(([year, count]) => ({ year, count }))
    );

    // Gender Chart
    const genderGroups = data.reduce(
      (acc, student) => {
        if (student.gender?.toLowerCase() === "male") acc.male++;
        else if (student.gender?.toLowerCase() === "female") acc.female++;
        return acc;
      },
      { male: 0, female: 0 }
    );
    setGenderChartData([
      { name: "Male", value: genderGroups.male },
      { name: "Female", value: genderGroups.female },
    ]);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) {
      const updated = students.filter((s) => s.id !== id);
      setStudents(updated);
      prepareCharts(updated);
    }
  };

  const filteredStudents = students.filter((s) =>
    `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ml-64  p-6 text-black bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Student Management Dashboard</h1>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-md"
        />
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto shadow rounded border mb-8">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#1E6C7B] text-white">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Gender</th>
              <th className="py-3 px-4">Year</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No student found.
                </td>
              </tr>
            ) : (
              filteredStudents.slice(0, visibleCount).map((student, index) => (
                <tr key={student.id} className="border-b hover:bg-blue-50">
                  
                  <td className="px-4 py-3">
                    {student.first_name} {student.middle_name ?? ""}{" "}
                    {student.last_name}
                  </td>
                  <td className="px-4 py-3">{student.email}</td>
                  <td className="px-4 py-3">{student.gender}</td>
                  <td className="px-4 py-3">{student.year}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {visibleCount < filteredStudents.length && (
          <div className="text-center mt-4 mb-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setVisibleCount((prev) => prev + 5)}
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="w-full h-72 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Students by Year
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3182CE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full h-72 bg-pink-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Gender Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                <Cell fill="#63b3ed" />
                <Cell fill="#f687b3" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
