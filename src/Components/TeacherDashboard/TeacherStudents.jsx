import React, { useEffect, useState } from "react";
import {
  getAllStudents,
  deleteStudent,
} from "../../supabaseConfig/supabaseApi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import Modal from "../Modal";

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [viewStudent, setViewStudent] = useState(null);
  const [performanceTrend, setPerformanceTrend] = useState([]); // For AreaChart
  const [progressLadder, setProgressLadder] = useState([]); // For StepLine

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const data = await getAllStudents();
    if (data) {
      setStudents(data);
      // Mock or fetch performance trend data
      const trend = (data || []).map((s) => ({
        name: `${s.first_name} ${s.last_name}`,
        performance: Math.floor(Math.random() * 100),
      }));
      setPerformanceTrend(trend);
      // Mock or fetch progress ladder data
      const ladder = (data || []).map((s) => ({
        name: `${s.first_name} ${s.last_name}`,
        progress: Math.floor(Math.random() * 100),
      }));
      setProgressLadder(ladder);
      // Extract unique years for filter dropdown
      const uniqueYears = Array.from(new Set(data.map((s) => s.year))).filter(
        Boolean
      );
      setYears(uniqueYears.sort());
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    const error = await deleteStudent(id);
    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Failed to delete student.");
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesName = `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesYear =
      yearFilter === "all" || String(s.year) === String(yearFilter);
    return matchesName && matchesYear;
  });

  // Only show up to visibleCount students
  const visibleStudents = filteredStudents.slice(0, visibleCount);

  // Prepare chart data based on filtered students (not all students)
  const performanceTrendData = filteredStudents.map((s, idx) => ({
    index: idx + 1,
    performance: Math.floor(Math.random() * 100), // Replace with real data if available
  }));
  const progressLadderData = filteredStudents.map((s, idx) => ({
    index: idx + 1,
    progress: Math.floor(Math.random() * 100), // Replace with real data if available
  }));

  return (
    <div className="w-full p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black  min-h-screen">
      {/* Summary Section: Filters and Search */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">My Students</h1>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded w-full max-w-md"
          />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="border px-4 py-2 rounded w-full max-w-xs"
          >
            <option value="all">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Student Table Section (moved to top) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">
            Total Students: {filteredStudents.length}
          </span>
        </div>
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
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No student found.
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-blue-50">
                    <td className="px-4 py-3">
                      {student.first_name} {student.middle_name ?? ""}{" "}
                      {student.last_name}
                    </td>
                    <td className="px-4 py-3">{student.email}</td>
                    <td className="px-4 py-3">{student.gender}</td>
                    <td className="px-4 py-3">{student.year}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => setViewStudent(student)}
                      >
                        View
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleDelete(student.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Show More / Show Less Buttons */}
          <div className="flex justify-center gap-4 my-4">
            {visibleCount < filteredStudents.length && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setVisibleCount((prev) => prev + 5)}
              >
                Show More
              </button>
            )}
            {visibleCount > 5 && (
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setVisibleCount((prev) => Math.max(5, prev - 5))}
              >
                Show Less
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Charts Section: Performance, Progress (moved below table) */}
      <div className="mb-8">
        {/* Student Performance Area Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Student Performance (Mountain Chart)
          </h2>
          <p className="text-gray-500 mb-2">
            X-axis: Student # &nbsp;|&nbsp; Y-axis: Performance Score (0-100)
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={performanceTrendData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorPerformance"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="index"
                tick={false}
                axisLine={false}
                label={null}
              />
              <YAxis
                label={{
                  value: "Performance Score",
                  angle: -90,
                  position: "insideLeft",
                }}
                domain={[0, 100]}
              />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="performance"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorPerformance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Student Progress Ladder Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Student Progress (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={progressLadderData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="index"
                tick={false}
                axisLine={false}
                label={null}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="progress"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* View Student Modal */}
      {viewStudent && (
        <Modal title="Student Details" onClose={() => setViewStudent(null)}>
          <h2 className="text-2xl font-bold mb-4">Student Details</h2>
          <div className="space-y-2">
            <div>
              <strong>Name:</strong> {viewStudent.first_name}{" "}
              {viewStudent.middle_name ?? ""} {viewStudent.last_name}
            </div>
            <div>
              <strong>Email:</strong> {viewStudent.email}
            </div>
            <div>
              <strong>Gender:</strong> {viewStudent.gender}
            </div>
            <div>
              <strong>Year:</strong> {viewStudent.year}
            </div>
            <div>
              <strong>Phone:</strong> {viewStudent.phone}
            </div>
            <div>
              <strong>Date of Birth:</strong> {viewStudent.dob}
            </div>
            <div>
              <strong>Address:</strong> {viewStudent.address}
            </div>
            {/* Add more fields as needed */}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherStudents;
