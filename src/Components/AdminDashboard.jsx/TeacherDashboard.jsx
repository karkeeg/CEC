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
  // Stats state
  const [teacherCount, setTeacherCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);

  useEffect(() => {
    const fetchStatsAndTeachers = async () => {
      setLoading(true);
      // Fetch teachers for table/chart
      const { data: teacherDepts, error } = await supabase.from(
        "teacher_departments"
      ).select(`
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
      if (!error && teacherDepts) setTeachers(teacherDepts);
      // Fetch stats
      const [
        { data: teachersData },
        { data: departmentsData },
        { data: subjectsData },
        { data: assignmentsData },
      ] = await Promise.all([
        supabase.from("teachers").select("id"),
        supabase.from("departments").select("id"),
        supabase.from("subjects").select("id"),
        supabase.from("assignments").select("id"),
      ]);
      setTeacherCount(teachersData?.length || 0);
      setDepartmentCount(departmentsData?.length || 0);
      setSubjectCount(subjectsData?.length || 0);
      setAssignmentCount(assignmentsData?.length || 0);
      setLoading(false);
    };
    fetchStatsAndTeachers();
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
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold mb-4">Teachers Dashboard</h1>
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow-md border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-center gap-4">
            <span className="text-green-500 text-3xl">👨‍🏫</span>
            <div>
              <p className="text-gray-500 text-sm">Total Teachers</p>
              <p className="text-2xl font-bold">{teacherCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md border-l-4 border-blue-500 p-4 rounded-md">
          <div className="flex items-center gap-4">
            <span className="text-blue-500 text-3xl">🏢</span>
            <div>
              <p className="text-gray-500 text-sm">Departments</p>
              <p className="text-2xl font-bold">{departmentCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md border-l-4 border-purple-500 p-4 rounded-md">
          <div className="flex items-center gap-4">
            <span className="text-purple-500 text-3xl">📚</span>
            <div>
              <p className="text-gray-500 text-sm">Subjects</p>
              <p className="text-2xl font-bold">{subjectCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md border-l-4 border-yellow-500 p-4 rounded-md">
          <div className="flex items-center gap-4">
            <span className="text-yellow-500 text-3xl">📝</span>
            <div>
              <p className="text-gray-500 text-sm">Assignments</p>
              <p className="text-2xl font-bold">{assignmentCount}</p>
            </div>
          </div>
        </div>
      </div>

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
