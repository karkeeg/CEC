import React, { useEffect, useState } from "react";
import {
  getAllTeachers,
  getAllDepartments,
  getAllSubjects,
  getAllAssignments,
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Loader from "../Loader";

const TeacherDashboard = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
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
      const { data: teacherData, error } = await supabase
        .from("teachers")
        .select(
          "id, first_name, middle_name, last_name, email, teacher_department, department:teacher_department(id, name)"
        );
      setTeachers(teacherData || []);
      // Fetch stats
      const [teachersData, departmentsData, subjectsData, assignmentsData] =
        await Promise.all([
          getAllTeachers(),
          getAllDepartments(),
          getAllSubjects(),
          getAllAssignments(),
        ]);
      setTeacherCount(teachersData?.length || 0);
      setDepartmentCount(departmentsData?.length || 0);
      setSubjectCount(subjectsData?.length || 0);
      setAssignmentCount(assignmentsData?.length || 0);
      setLoading(false);
    };
    fetchStatsAndTeachers();
  }, []);

  const filtered = teachers.filter((t) => {
    const nameMatch = `${t.first_name ?? ""} ${t.middle_name ?? ""} ${
      t.last_name ?? ""
    }`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const departmentMatch =
      departmentFilter === "all" || t.department?.name === departmentFilter;
    return nameMatch && departmentMatch;
  });

  const groupedByDepartment = filtered.reduce((acc, t) => {
    const department = t.department?.name || "Unknown";
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {});

  const departmentChartData = Object.entries(groupedByDepartment).map(
    ([name, count]) => ({ name, count })
  );

  // Get unique departments for filter dropdown
  const uniqueDepartments = [
    ...new Set(teachers.map((t) => t.department?.name).filter(Boolean)),
  ].sort();

  // Color palette for different departments
  const departmentColors = [
    "#3182CE", // Blue
    "#38A169", // Green
    "#D69E2E", // Yellow
    "#E53E3E", // Red
    "#805AD5", // Purple
    "#DD6B20", // Orange
    "#319795", // Teal
    "#D53F8C", // Pink
    "#2B6CB0", // Dark Blue
    "#2F855A", // Dark Green
    "#C05621", // Dark Orange
    "#9F7AEA", // Light Purple
    "#4FD1C7", // Light Teal
    "#F6AD55", // Light Orange
    "#FC8181", // Light Red
    "#68D391", // Light Green
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading teacher dashboard data..." />
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100">
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

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search teacher by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded-md flex-1 max-w-md"
        />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="p-2 border rounded-md flex-1 max-w-md"
        >
          <option value="all">All Departments</option>
          {uniqueDepartments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {(searchTerm || departmentFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setDepartmentFilter("all");
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Filter Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filtered.length} of {teachers.length} teachers
        {departmentFilter !== "all" && ` in ${departmentFilter}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      <div className="mb-6">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-lg">No teachers found.</p>
        ) : (
          <div className="overflow-x-auto">
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
                      {t.first_name} {t.middle_name ?? ""} {t.last_name}
                    </td>
                    <td className="px-4 py-2">{t.email}</td>
                    <td className="px-4 py-2">
                      {t.department?.name || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="text-center mt-4 mb-8">
        <div className="flex justify-center gap-3">
          {/* Show Less Button */}
          {visibleCount > 10 && (
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              onClick={() => setVisibleCount((prev) => Math.max(10, prev - 5))}
            >
              Show Less
            </button>
          )}

          {/* Show More Button */}
          {visibleCount < filtered.length && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              onClick={() => setVisibleCount((prev) => prev + 5)}
            >
              Show More
            </button>
          )}

          {/* Show All Button */}
          {visibleCount < filtered.length && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              onClick={() => setVisibleCount(filtered.length)}
            >
              Show All
            </button>
          )}

          {/* Collapse All Button */}
          {visibleCount > 10 && visibleCount === filtered.length && (
            <button
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
              onClick={() => setVisibleCount(10)}
            >
              Collapse All
            </button>
          )}
        </div>

        {/* Pagination Info */}
        {filtered.length > 10 && (
          <div className="mt-2 text-sm text-gray-600">
            Showing {Math.min(visibleCount, filtered.length)} of{" "}
            {filtered.length} teachers
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-4 shadow rounded mb-10">
        <h2 className="text-xl font-semibold mb-4">Teachers by Department</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentChartData}>
            <XAxis dataKey="name" hide={true} />
            <YAxis
              domain={[
                0,
                Math.max(...departmentChartData.map((item) => item.count), 10),
              ]}
              tickCount={
                Math.ceil(
                  Math.max(
                    ...departmentChartData.map((item) => item.count),
                    10
                  ) / 2
                ) + 1
              }
              interval={0}
              label={{
                value: "Number of Teachers",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              labelFormatter={(value) => value}
              formatter={(value, name) => [value, "Teachers"]}
            />
            <Bar dataKey="count">
              {departmentChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={departmentColors[index % departmentColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center mt-2 text-sm text-gray-600 font-medium">
          Departments
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
