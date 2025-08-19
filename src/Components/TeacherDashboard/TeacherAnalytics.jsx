import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getClassesByTeacher,
  getAllStudents,
  getAllAssignments,
  getAllClasses,
  fetchAssignments,
  fetchAssignmentSubmissions,
  fetchAttendance,
  getStudentsByClass,
  getTeacherStudentPerformanceStats,
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
import Loader from "../Loader";

// Cache keys for localStorage
const CACHE_KEYS = {
  ANALYTICS: 'teacher_analytics_cache',
  PERFORMANCE_STATS: 'teacher_analytics_performance_cache',
  CHART_DATA: 'teacher_analytics_chart_data',
  CACHE_TIMESTAMP: 'teacher_analytics_timestamp'
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const TeacherAnalytics = () => {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    averageGrade: 0,
  });
  const [performanceStats, setPerformanceStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    averageGrade: 0,
    highPerformers: 0,
    needsAttention: 0,
    recentActivity: 0,
    highPerformerNames: [],
    needsAttentionNames: [],
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if cached data is still valid
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  };

  // Load data from cache
  const loadFromCache = () => {
    try {
      const cachedAnalytics = localStorage.getItem(CACHE_KEYS.ANALYTICS);
      const cachedPerformanceStats = localStorage.getItem(CACHE_KEYS.PERFORMANCE_STATS);
      const cachedChartData = localStorage.getItem(CACHE_KEYS.CHART_DATA);
      
      if (cachedAnalytics && cachedPerformanceStats && cachedChartData) {
        const analyticsData = JSON.parse(cachedAnalytics);
        const performanceData = JSON.parse(cachedPerformanceStats);
        const chartData = JSON.parse(cachedChartData);
        
        setAnalytics(analyticsData);
        setPerformanceStats(performanceData);
        setClassPerformanceData(chartData.classPerformanceData || []);
        setAttendanceTrendData(chartData.attendanceTrendData || []);
        setGradeDistributionData(chartData.gradeDistributionData || []);
        setAssignmentCompletionData(chartData.assignmentCompletionData || []);
        
        return true;
      }
    } catch (error) {
      console.error("Error loading analytics cache:", error);
    }
    return false;
  };

  // Save data to cache
  const saveToCache = (analyticsData, performanceData, chartData) => {
    try {
      localStorage.setItem(CACHE_KEYS.ANALYTICS, JSON.stringify(analyticsData));
      localStorage.setItem(CACHE_KEYS.PERFORMANCE_STATS, JSON.stringify(performanceData));
      localStorage.setItem(CACHE_KEYS.CHART_DATA, JSON.stringify(chartData));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error("Error saving analytics cache:", error);
    }
  };

  // Generate chart data
  const generateChartData = (classes, assignments, attendance, performanceData) => {
    const chartData = {};

    // Grade Distribution Data (for pie chart)
    const gradeDistribution = [
      { name: "A (90-100)", value: 25, color: "#10B981" },
      { name: "B (80-89)", value: 35, color: "#3B82F6" },
      { name: "C (70-79)", value: 25, color: "#F59E0B" },
      { name: "D (60-69)", value: 10, color: "#EF4444" },
      { name: "F (<60)", value: 5, color: "#6B7280" },
    ];
    setGradeDistributionData(gradeDistribution);
    chartData.gradeDistributionData = gradeDistribution;

    // Class Performance Data (for bar chart)
    const classPerformance = (classes || []).map((cls, index) => ({
      name: cls.name || `Class ${index + 1}`,
      students: Math.floor(Math.random() * 30) + 10, // Mock data
      avgGrade: Math.floor(Math.random() * 40) + 60, // Mock data
      attendance: Math.floor(Math.random() * 30) + 70, // Mock data
    }));
    setClassPerformanceData(classPerformance);
    chartData.classPerformanceData = classPerformance;

    return chartData;
  };

  // Score distribution state
  const [scoreDistribution, setScoreDistribution] = useState([]);
  // Performance overview state
  const [performanceOverview, setPerformanceOverview] = useState([
    { label: "Avg Grade", value: "-" },
    { label: "Top Score", value: "-" },
    { label: "Social", value: "-" },
  ]);
  // Absence alerts state
  const [absenceAlerts, setAbsenceAlerts] = useState([]);

  // Demo state for filters
  const [semester, setSemester] = useState("Semester I");
  const [selectedCourses, setSelectedCourses] = useState(["Physics"]);

  useEffect(() => {
    if (!user?.id) return;

    // Try to load from cache first
    if (isCacheValid() && loadFromCache()) {
      setLoading(false);
      return;
    }

    // If no valid cache, fetch fresh data
    fetchAnalyticsData();
  }, [user?.id]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch performance stats using the existing API
      const performanceData = await getTeacherStudentPerformanceStats(user.id);
      const performanceStatsData = performanceData || {
        totalStudents: 0,
        averageAttendance: 0,
        averageGrade: 0,
        highPerformers: 0,
        needsAttention: 0,
        recentActivity: 0,
      };
      setPerformanceStats(performanceStatsData);

      // Fetch basic analytics data
      const [classes, assignments, attendance] = await Promise.all([
        getClassesByTeacher(user.id),
        fetchAssignments(),
        fetchAttendance({ teacher_id: user.id }),
      ]);

      // Calculate analytics
      const totalClasses = classes?.length || 0;
      const totalAssignments = assignments?.length || 0;
      const totalStudents = performanceData?.totalStudents || 0;
      const averageGrade = performanceData?.averageGrade || 0;

      const analyticsData = {
        totalStudents,
        totalClasses,
        totalAssignments,
        averageGrade,
      };
      setAnalytics(analyticsData);

      // Generate chart data
      const chartData = generateChartData(classes, assignments, attendance, performanceData);
      
      // Save to cache
      saveToCache(analyticsData, performanceStatsData, chartData);
      
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading analytics data..." />
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-w-0">
      {/* Top Bar: Analytics Title, Export PDF */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2 min-w-0">
        <div className="flex items-center gap-2 mb-4 md:mb-0 min-w-0">
          <FaChartLine className="text-2xl text-gray-700 mr-2" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words min-w-0">
            Analytics
          </h1>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-lg flex items-center gap-2 font-semibold shadow w-full md:w-auto justify-center">
          Export pdf <FaFileExport />
        </button>
      </div>
      {/* Filters Row
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-base sm:text-lg text-gray-700">
            Semester
          </span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-blue-100 text-blue-900 px-3 sm:px-4 py-2 rounded font-semibold"
          >
            <option>Semester I</option>
            <option>Semester II</option>
          </select>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-base sm:text-lg text-gray-700">
            Courses:
          </span>
          {selectedCourses.map((course, idx) => (
            <select
              key={idx}
              value={course}
              onChange={(e) => {
                const newCourses = [...selectedCourses];
                newCourses[idx] = e.target.value;
                setSelectedCourses(newCourses);
              }}
              className="bg-blue-100 text-blue-900 px-3 sm:px-4 py-2 rounded font-semibold"
            >
              <option>Physics</option>
              <option>Math</option>
              <option>C programming</option>
              <option>English</option>
              <option>Statistics</option>
            </select>
          ))}
        </div>
      </div> */}

      {/* Summary Section: Stat Cards */}
      <div className="mb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 min-w-0">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">
                  Total Students
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2 break-words">
                  {analytics.totalStudents}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-500 rounded-full">
                <FaUsers className="text-white text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">
                  Total Classes
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2 break-words">
                  {analytics.totalClasses}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-500 rounded-full">
                <FaBook className="text-white text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">
                  Assignments
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2 break-words">
                  {analytics.totalAssignments}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-500 rounded-full">
                <FaGraduationCap className="text-white text-lg sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">
                  Avg Grade
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2 break-words">
                  {analytics.averageGrade}%
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-500 rounded-full">
                <FaChartLine className="text-white text-lg sm:text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 min-w-0">
        {/* Left Column: Performance Overview & Absence Alerts */}
        <div className="flex flex-col gap-4 sm:gap-8 min-w-0">
          {/* Performance Overview */}
          <div className="bg-blue-100 rounded-xl p-3 sm:p-4 shadow flex flex-col items-center min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4">
              Performance overview
            </h2>
            <div className="flex flex-row gap-2 min-w-0">
              {performanceOverview.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 border border-blue-200 rounded-lg px-2 sm:px-3 py-2 flex flex-col items-center min-w-[90px] sm:min-w-[110px]"
                >
                  <span className="text-xs sm:text-md text-gray-600 font-medium mb-1">
                    {item.label}
                  </span>
                  <span className="text-lg sm:text-2xl font-bold text-center text-gray-900 break-words">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Absence Alerts */}
          <div className="bg-blue-100 rounded-xl p-3 sm:p-6 shadow overflow-x-auto min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4">
              Absence Alerts
            </h2>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full rounded overflow-x-auto min-w-0">
                <thead>
                  <tr className="bg-cyan-900 text-white">
                    <th className="py-2 px-2 sm:px-4 text-left text-xs sm:text-base">
                      Student Name
                    </th>
                    <th className="py-2 px-2 sm:px-4 text-left text-xs sm:text-base">
                      Absences
                    </th>
                    <th className="py-2 px-2 sm:px-4 text-left text-xs sm:text-base">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {absenceAlerts.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        (idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100") +
                        " border-b last:border-b-0"
                      }
                    >
                      <td className="py-2 px-2 sm:px-4 break-words">
                        {row.name}
                      </td>
                      <td className="py-2 px-2 sm:px-4">{row.absences}</td>
                      <td className="py-2 px-2 sm:px-4">
                        <button className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 sm:px-3 py-1 rounded font-semibold text-xs sm:text-sm">
                          Send
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* High Performers - Below Absence Alerts */}
          {performanceStats.highPerformerNames &&
            performanceStats.highPerformerNames.length > 0 && (
              <div className="bg-green-100 rounded-xl p-3 sm:p-6 shadow overflow-x-auto min-w-0">
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  High Performers (Grade ≥ 85%)
                </h2>
                <div className="space-y-3">
                  {performanceStats.highPerformerNames.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {student.name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-sm text-green-600 font-semibold">
                            {student.averageGrade}% Average
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
        {/* Right Column: Score Distribution Chart */}
        <div>
          <div className="bg-blue-50 rounded-xl p-3 sm:p-6 shadow flex flex-col min-w-0 ">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center gap-2">
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
              Assignment Performance
            </h2>
            <div className="w-full min-w-0 overflow-x-auto">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={scoreDistribution}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="course"
                    label={{
                      value: "Assignment ->",
                      position: "insideBottom",
                      offset: 10,
                    }}
                    tick={false}
                  />
                  <YAxis
                    label={{
                      value: "Average Grade (%)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="marks"
                    fill="#1E90FF"
                    barSize={30}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Needs Attention - Below Score Distribution */}
          {performanceStats.needsAttentionNames &&
            performanceStats.needsAttentionNames.length > 0 && (
              <div className="bg-red-100 rounded-xl p-3 sm:p-6 shadow overflow-x-auto min-w-0 mt-4 sm:mt-6">
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Needs Attention (Grade &lt; 60%)
                </h2>
                <div className="space-y-3">
                  {performanceStats.needsAttentionNames.map(
                    (student, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">
                              {student.name
                                .split(" ")
                                .map((n) => n.charAt(0))
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.name}
                            </p>
                            <p className="text-sm text-red-600 font-semibold">
                              {student.averageGrade}% Average
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
  

      {/* Charts
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 mb-8 min-w-0">
        {/* Attendance Mountain Chart */}
        {/* <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md min-w-0 overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
            Attendance Trends (Last 30 Days)
          </h2>
          <div className="w-full min-w-0 overflow-x-auto">
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
                <XAxis
                  dataKey="date"
                  label={{
                    value: "Date ->",
                    position: "insideBottom",
                    offset: 10,
                  }}
                  tick={false}
                />
                <YAxis
                  label={{
                    value: "No of Attendies ->",
                    angle: -90,
                    position: "insideLeft",
                    // offset: 15,
                    style: { textAnchor: "middle" },
                  }}
                  domain={[0, 25]}
                />
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
        </div> */}

        {/* Class Performance */}
        {/* <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md min-w-0 overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
            Class Performance
          </h2>
          <div className="w-full min-w-0 overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classData}>
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="students"
                  fill="#3B82F6"
                  name="Students"
                />
                <Bar
                  yAxisId="left"
                  dataKey="assignments"
                  fill="#10B981"
                  name="Assignments"
                />
                <Bar
                  yAxisId="right"
                  dataKey="attendanceRate"
                  fill="#F59E0B"
                  name="Attendance Rate (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}
      {/* </div>  */}
    </div>
  );
};

export default TeacherAnalytics;