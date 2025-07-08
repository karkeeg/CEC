import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TeacherDashboard = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("teacher_departments")
        .select(`
        id,
        teacher:teacher_id (
          id,
          first_name,
          middle_name,
          last_name,
          email
        ),
        department:department_id (
          id,
          name
        )
      `);

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setTeachers(data);
      }
      setLoading(false);
    };

    fetchTeachers();
  }, []);

  const filtered = teachers.filter((t) =>
    `${t.teacher?.first_name ?? ""} ${t.teacher?.middle_name ?? ""} ${
      t.teacher?.last_name ?? ""
    }`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const groupedBySubject = filtered.reduce((acc, t) => {
    const subject = t.department?.name || "Unknown";
    acc[subject] = (acc[subject] || 0) + 1;
    return acc;
  }, {});

  const subjectChartData = Object.entries(groupedBySubject).map(
    ([name, count]) => ({ name, count })
  );

  return (
    <div className="ml-64 p-6">
      <h1 className="text-2xl font-bold mb-4">Teachers Dashboard</h1>

      <input
        type="text"
        placeholder="Search teacher by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border rounded-md w-full max-w-md"
      />

      <div className="overflow-x-auto mb-6">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-lg">No teachers found.</p>
        ) : (
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Department</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visibleCount).map((t, idx) => (
                <tr key={idx} className="text-center border-t">
                  <td className="px-4 py-2">
                    {t.teacher?.first_name} {t.teacher?.middle_name ?? ""}{" "}
                    {t.teacher?.last_name}
                  </td>
                  <td className="px-4 py-2">{t.teacher?.email}</td>
                  <td className="px-4 py-2">
                    {t.department?.name || "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((prev) => prev + 5)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-8"
        >
          Show More
        </button>
      )}

      {/* Chart Section */}
      <div className="bg-white p-4 shadow rounded mb-10">
        <h2 className="text-xl font-semibold mb-4">Teachers by Subject</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#007bff" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TeacherDashboard;
