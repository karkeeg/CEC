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
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      try {
        // Fetch all classes taught by this teacher
        const classesData = await getClassesByTeacher(user.id);
        const classIds = (classesData || []).map((c) => c.class_id);
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
        // --- Score Distribution: Real Data ---
        // 1. Get all assignments for this teacher
        const teacherAssignments = await fetchAssignments({
          teacher_id: user.id,
        });
        // 2. For each assignment, fetch all submissions and their grades
        const courseGrades = {};
        // For performance overview
        let allGrades = [];
        let topStudent = null;
        let topScore = -Infinity;
        let studentScores = {}; // { studentName: [grades] }
        for (const assignment of teacherAssignments) {
          const subject =
            assignment.subject?.name || assignment.subject || "Unknown";
          const submissions = await fetchAssignmentSubmissions(assignment.id);
          for (const submission of submissions) {
            const gradeValue = submission.grade?.grade;
            if (gradeValue !== undefined && gradeValue !== null) {
              if (!courseGrades[subject]) {
                courseGrades[subject] = [];
              }
              courseGrades[subject].push(Number(gradeValue));
              // For performance overview
              allGrades.push(Number(gradeValue));
              const studentName = submission.student
                ? `${submission.student.first_name || ""} ${
                    submission.student.last_name || ""
                  }`.trim()
                : "Unknown";
              if (!studentScores[studentName]) studentScores[studentName] = [];
              studentScores[studentName].push(Number(gradeValue));
              if (Number(gradeValue) > topScore) {
                topScore = Number(gradeValue);
                topStudent = studentName;
              }
            }
          }
        }
        // 3. Aggregate: average grade per course
        const scoreDistArr = Object.entries(courseGrades).map(
          ([course, grades]) => ({
            course,
            marks:
              grades.length > 0
                ? grades.reduce((a, b) => a + b, 0) / grades.length
                : 0,
          })
        );
        setScoreDistribution(scoreDistArr);
        // --- Performance Overview: Real Data ---
        const avgGrade =
          allGrades.length > 0
            ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
            : 0;
        const numAbove80 = allGrades.filter((g) => g >= 80).length;
        const numGradedSubmissions = allGrades.length;
        setPerformanceOverview([
          { label: "Avg Grade", value: `${avgGrade.toFixed(1)}%` },
          {
            label: "Top Score",
            value: topStudent ? `${topStudent} ${topScore}%` : "-",
          },
          { label: "Submissions Graded", value: `${numGradedSubmissions}` },
        ]);
        // --- Absence Alerts: Real Data ---
        // 1. Fetch all students in the teacher's classes
        let studentsData = [];
        if (classIds.length > 0) {
          studentsData = await getAllStudents();
          studentsData = studentsData.filter((s) =>
            classIds.includes(s.class_id)
          );
        }
        // 2. Fetch all attendance records for these classes
        let attendanceRecords = [];
        if (classIds.length > 0) {
          attendanceRecords = await fetchAttendance({ teacher_id: user.id });
        }
        // 3. Count absences per student
        const absenceCount = {};
        attendanceRecords.forEach((record) => {
          if (record.status === "absent") {
            absenceCount[record.student_id] =
              (absenceCount[record.student_id] || 0) + 1;
          }
        });
        // 4. Map to alert format and sort
        const alerts = Object.entries(absenceCount)
          .map(([studentId, absences]) => {
            const student = studentsData.find((s) => s.id === studentId);
            return {
              name: student
                ? `${student.first_name} ${student.last_name}`
                : "Unknown",
              absences,
            };
          })
          .sort((a, b) => b.absences - a.absences)
          .slice(0, 5); // Show top 5
        setAbsenceAlerts(alerts);
        // --- Attendance Trends: Last 30 Days ---
        // 1. Get date range for last 30 days
        const today = new Date();
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (29 - i));
          return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        });
        // 2. Aggregate attendance by date
        const attendanceByDate = {};
        last30Days.forEach((date) => {
          attendanceByDate[date] = { date, present: 0, absent: 0, late: 0 };
        });
        attendanceRecords.forEach((record) => {
          const date = record.date;
          if (attendanceByDate[date]) {
            if (record.status === "present") attendanceByDate[date].present++;
            else if (record.status === "absent")
              attendanceByDate[date].absent++;
            else if (record.status === "late") attendanceByDate[date].late++;
          }
        });
        setAttendanceData(Object.values(attendanceByDate));
        // --- Assignment Completion Rate & Class Performance ---
        // For each class, calculate completion rate and student count
        const classDataArr = [];
        for (const classObj of classesData) {
          const classId = classObj.class_id;
          const className = classObj.name || "Class";
          // Students in this class
          const studentsInClass = studentsData.filter(
            (s) => s.class_id === classId
          );
          const numStudents = studentsInClass.length;
          // Assignments for this class
          const assignmentsForClass = teacherAssignments.filter(
            (a) => a.class_id === classId
          );
          const numAssignments = assignmentsForClass.length;
          // Submissions for this class
          let numSubmissions = 0;
          for (const assignment of assignmentsForClass) {
            const submissions = await fetchAssignmentSubmissions(assignment.id);
            numSubmissions += submissions.length;
          }
          // Completion rate: submissions / (assignments * students)
          let completionRate = 0;
          if (numAssignments > 0 && numStudents > 0) {
            completionRate =
              (numSubmissions / (numAssignments * numStudents)) * 100;
          }
          classDataArr.push({
            name: className,
            completionRate: Number(completionRate.toFixed(1)),
            students: numStudents,
          });
        }
        setClassData(classDataArr);
        // --- Class Performance Multi-Bar Chart Data ---
        const classPerformanceArr = [];
        for (const classObj of classesData) {
          const classId = classObj.class_id;
          const className = classObj.name || "Class";
          // Students in this class
          const studentsInClass = await getStudentsByClass(classId);
          const numStudents = studentsInClass.length;
          // Assignments for this class
          const assignmentsForClass = teacherAssignments.filter(
            (a) => a.class_id === classId
          );
          const numAssignments = assignmentsForClass.length;
          // Attendance for this class
          const attendanceForClass = attendanceRecords.filter(
            (rec) => rec.class_id === classId
          );
          const presentCount = attendanceForClass.filter(
            (rec) => rec.status === "present"
          ).length;
          const totalAttendance = attendanceForClass.length;
          const attendanceRate =
            totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
          classPerformanceArr.push({
            name: className,
            students: numStudents,
            assignments: numAssignments,
            attendanceRate: Number(attendanceRate.toFixed(1)),
          });
        }
        setClassData(classPerformanceArr);
      } catch (error) {
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
      {/* Filters Row */}
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
      </div>

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
        </div>
        {/* Right Column: Score Distribution Chart */}
        <div className="bg-blue-50 rounded-xl p-3 sm:p-6 shadow flex flex-col min-w-0 overflow-x-auto">
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
            Score Distribution
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
      </div>
      {/* Charts Section: Attendance, Grade, Class Performance, etc. */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 mb-8 min-w-0">
        {/* Attendance Mountain Chart */}
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md min-w-0 overflow-x-auto">
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
        </div>

        {/* Class Performance */}
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md min-w-0 overflow-x-auto">
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
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
