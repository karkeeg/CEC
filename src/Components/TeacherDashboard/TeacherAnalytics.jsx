import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getClassesByTeacher,
  getAllStudents,
  getAllAssignments,
  getAllClasses,
} from "../../supabaseConfig/supabaseApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart, // Added for mountain chart
  Area,
  ComposedChart,
} from "recharts";
import {
  FaUsers,
  FaBook,
  FaChartLine,
  FaGraduationCap,
  FaFileExport,
} from "react-icons/fa";

const TeacherAnalytics = () => {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    averageGrade: 0,
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Demo state for filters
  const [semester, setSemester] = useState("Semester I");
  const [selectedCourses, setSelectedCourses] = useState([
    "Physics",
    "Physics",
    "Physics",
  ]);

  // Demo data for performance overview
  const performanceOverview = [
    { label: "Avg Grade", value: "90%" },
    { label: "Top Score", value: "Alex 90%" },
    { label: "Social", value: "89% total" },
  ];

  // Demo data for absence alerts
  const absenceAlerts = [
    { name: "Jhon", assignment: "92%" },
    { name: "Surasa", assignment: "92%" },
    { name: "Sai", assignment: "92%" },
  ];

  // Demo data for score distribution
  const scoreDistribution = [
    { course: "Math", marks: 20 },
    { course: "C programming", marks: 15 },
    { course: "English", marks: 45 },
    { course: "Statistics", marks: 50 },
    { course: "Statistics", marks: 50 },
    { course: "Course", marks: 18 },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      try {
        // Fetch all classes taught by this teacher
        const classesData = await getClassesByTeacher(user.id);
        const classIds = (classesData || []).map((c) => c.id);
        // Fetch students whose class_id is in classIds
        let studentsCount = 0;
        if (classIds.length > 0) {
          const studentsData = await getAllStudents();
          studentsCount = (studentsData || []).filter((s) =>
            classIds.includes(s.class_id)
          ).length;
        }
        // Fetch assignments and all classes for global stats
        const assignmentsData = await getAllAssignments();
        const allClassesData = await getAllClasses();
        setAnalytics({
          totalStudents: studentsCount,
          totalClasses: allClassesData?.length || 0,
          totalAssignments: assignmentsData?.length || 0,
          averageGrade: 0, // Set to 0 or mock unless you want to calculate real grades
        });
        // Optionally, you can fetch and set attendanceData, gradeData, classData as needed
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      {/* Top Bar: Analytics Title, Export PDF */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <FaChartLine className="text-2xl text-gray-700 mr-2" />
          <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold shadow">
          Export pdf <FaFileExport />
        </button>
      </div>
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg text-gray-700">Semester</span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-blue-100 text-blue-900 px-4 py-2 rounded font-semibold"
          >
            <option>Semester I</option>
            <option>Semester II</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg text-gray-700">Courses:</span>
          {selectedCourses.map((course, idx) => (
            <select
              key={idx}
              value={course}
              onChange={(e) => {
                const newCourses = [...selectedCourses];
                newCourses[idx] = e.target.value;
                setSelectedCourses(newCourses);
              }}
              className="bg-blue-100 text-blue-900 px-4 py-2 rounded font-semibold"
            >
              <option>Physics</option>
              <option>Math</option>
              <option>C programming</option>
              <option>English</option>
              <option>Statistics</option>
            </select>
          ))}
        </div>
      </div>

      {/* Summary Section: Stat Cards */}
      <div className="mb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics.totalStudents}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <FaUsers className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics.totalClasses}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <FaBook className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Assignments</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics.totalAssignments}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <FaGraduationCap className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Grade</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics.averageGrade}%
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <FaChartLine className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Performance Overview & Absence Alerts */}
        <div className="flex flex-col gap-8">
          {/* Performance Overview */}
          <div className="bg-blue-100 rounded-xl p-6 shadow flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Performance overview
            </h2>
            <div className="flex flex-row gap-6">
              {performanceOverview.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 flex flex-col items-center min-w-[110px]"
                >
                  <span className="text-md text-gray-600 font-medium mb-1">
                    {item.label}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Absence Alerts */}
          <div className="bg-blue-100 rounded-xl p-6 shadow">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Absence Alerts
            </h2>
            <table className="w-full rounded overflow-hidden">
              <thead>
                <tr className="bg-cyan-900 text-white">
                  <th className="py-2 px-4 text-left">Student Name</th>
                  <th className="py-2 px-4 text-left">Assignment</th>
                  <th className="py-2 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {absenceAlerts.map((row, idx) => (
                  <tr key={idx} className="bg-blue-50 border-b last:border-b-0">
                    <td className="py-2 px-4">{row.name}</td>
                    <td className="py-2 px-4">{row.assignment}</td>
                    <td className="py-2 px-4">
                      <button className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded font-semibold text-sm">
                        Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Right Column: Score Distribution Chart */}
        <div className="bg-blue-50 rounded-xl p-6 shadow flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="inline-block mr-1"
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
              >
                <rect width="24" height="24" fill="none" />
                <path
                  d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8z"
                  fill="#222F3E"
                />
              </svg>
            </span>
            Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={scoreDistribution}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="course"
                label={{
                  value: "Course",
                  position: "insideBottomRight",
                  offset: 0,
                }}
              />
              <YAxis
                label={{ value: "Marks", angle: -90, position: "insideLeft" }}
                domain={[0, 100]}
              />
              <Tooltip />
              <Bar
                dataKey="marks"
                fill="#1E90FF"
                barSize={40}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Charts Section: Attendance, Grade, Class Performance, etc. */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 mb-8">
        {/* Attendance Mountain Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Attendance Trends (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={attendanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorPresent)"
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="#EF4444"
                fill="#fee2e2"
              />
              <Area
                type="monotone"
                dataKey="late"
                stroke="#F59E0B"
                fill="#fef3c7"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assignment Completion Ladder Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Assignment Completion Rate (Step/Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={classData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="completionRate"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Class Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Class Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
