import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getAllStudents,
  getAllAssignments,
  getAllClasses,
  getGradesByTeacher,
  createAssignment,
  createAttendance,
  fetchStudents,
  fetchAssignments,
  fetchClasses,
  getSubjects,
  updateAssignmentSubmissionGrade,
} from "../../supabaseConfig/supabaseApi";
import {
  FaUsers,
  FaBook,
  FaClipboardList,
  FaCalendarCheck,
  FaChartLine,
  FaBell,
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { AssignmentForm } from "../Forms/AssignmentForm";
import AttendanceForm from "../Forms/AttendanceForm";

const TeacherMainDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]); // For AreaChart
  const [completionData, setCompletionData] = useState([]); // For StepLine
  const [todaysSchedule, setTodaysSchedule] = useState({
    classes: [],
    assignments: [],
  }); // For today's schedule

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Assignment form state
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [assignmentDue, setAssignmentDue] = useState("");
  const [assignmentClass, setAssignmentClass] = useState("");
  const [assignmentSubject, setAssignmentSubject] = useState("");

  // Attendance form state
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceClass, setAttendanceClass] = useState("");
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});

  // Grade form state
  const [gradeAssignment, setGradeAssignment] = useState("");
  const [gradeStudent, setGradeStudent] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [gradeStudents, setGradeStudents] = useState([]);
  const [gradeAssignments, setGradeAssignments] = useState([]);

  // Report form state
  const [reportType, setReportType] = useState("attendance");
  const [reportData, setReportData] = useState([]);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Fetch classes, subjects, assignments, students for dropdowns
  useEffect(() => {
    fetchClasses().then(setClasses);
    getSubjects().then(setSubjects);
    fetchAssignments().then(setAssignments);
    fetchStudents().then(setStudents);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        // Fetch total students and assignments from the whole database
        const [studentsData, assignmentsData, classesData] = await Promise.all([
          getAllStudents(),
          getAllAssignments(),
          getAllClasses(),
        ]);
        setStats({
          totalStudents: studentsData?.length || 0,
          totalClasses: classesData?.length || 0,
          totalAssignments: assignmentsData?.length || 0,
          attendanceRate: 85,
        });
        // Fetch recent assignments for this teacher
        const teacherAssignments = (assignmentsData || [])
          .filter((a) => a.teacher_id === user.id)
          .slice(0, 5);
        setRecentActivities(teacherAssignments || []);
        // Fetch average grades over time for AreaChart
        const gradesData = await getGradesByTeacher(user.id);
        setPerformanceData(gradesData || []);
        // Prepare assignment completion data for StepLine
        const completion = (assignmentsData || [])
          .filter((a) => a.teacher_id === user.id)
          .map((a) => ({
            name: a.title,
            completion: a.total_count
              ? Math.round((a.completed_count / a.total_count) * 100)
              : 0,
          }));
        setCompletionData(completion);
        // Fetch today's schedule
        const today = new Date().toISOString().split("T")[0];
        const todaysClasses = (classesData || []).filter(
          (c) => c.teacher_id === user.id && c.date === today
        );
        const todaysAssignments = (assignmentsData || []).filter(
          (a) => a.teacher_id === user.id && a.due_date?.split("T")[0] === today
        );
        setTodaysSchedule({
          classes: todaysClasses,
          assignments: todaysAssignments,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // Fetch students for attendance and grading
  useEffect(() => {
    if (attendanceClass) {
      fetchStudents(attendanceClass).then(setAttendanceStudents);
    }
  }, [attendanceClass]);
  useEffect(() => {
    if (gradeAssignment) {
      fetchAssignments().then((data) => {
        setGradeAssignments(data || []);
        // Optionally filter students for the assignment
      });
    }
  }, [gradeAssignment]);

  // Handlers for Quick Actions
  const handleCreateAssignment = async () => {
    await createAssignment({
      title: assignmentTitle,
      description: assignmentDesc,
      due_date: assignmentDue,
      class_id: assignmentClass,
      subject_id: assignmentSubject,
      teacher_id: user.id,
      created_at: new Date().toISOString(),
    });
    setShowAssignmentModal(false);
    setAssignmentTitle("");
    setAssignmentDesc("");
    setAssignmentDue("");
    setAssignmentClass("");
    setAssignmentSubject("");
    alert("Assignment created!");
  };
  const handleSaveAttendance = async () => {
    if (!attendanceClass || !attendanceDate)
      return alert("Select class and date");
    const records = attendanceStudents.map((s) => ({
      student_id: s.student?.id || s.id,
      class_id: attendanceClass,
      date: attendanceDate,
      status: attendanceStatus[s.student?.id || s.id] || "present",
      teacher_id: user.id,
      created_at: new Date().toISOString(),
    }));
    await createAttendance(records);
    setShowAttendanceModal(false);
    setAttendanceClass("");
    setAttendanceStudents([]);
    setAttendanceStatus({});
    alert("Attendance saved!");
  };
  const handleSaveGrade = async () => {
    if (!gradeAssignment || !gradeStudent || !gradeValue)
      return alert("Fill all fields");
    await updateAssignmentSubmissionGrade(gradeStudent, { grade: gradeValue });
    setShowGradeModal(false);
    setGradeAssignment("");
    setGradeStudent("");
    setGradeValue("");
    alert("Grade saved!");
  };
  const handleViewReport = async () => {
    // Example: fetch attendance or grades based on reportType
    // setReportData(...)
    alert("Report feature coming soon!");
    setShowReportModal(false);
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Summary Section: Stat Cards, Schedule, Recent Activities, Quick Actions */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          See Our Dashboard {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today.
        </p>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 mb-8">
          <StatCard
            icon={<FaUsers className="text-white text-xl" />}
            title="Total Students"
            value={stats.totalStudents}
            color="bg-blue-500"
          />
          <StatCard
            icon={<FaBook className="text-white text-xl" />}
            title="Active Classes"
            value={stats.totalClasses}
            color="bg-green-500"
          />
          <StatCard
            icon={<FaClipboardList className="text-white text-xl" />}
            title="Assignments"
            value={stats.totalAssignments}
            color="bg-purple-500"
          />
          <StatCard
            icon={<FaCalendarCheck className="text-white text-xl" />}
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            color="bg-orange-500"
          />
        </div>
        {/* Today's Schedule */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Today's Schedule
          </h2>
          {todaysSchedule.classes.length === 0 &&
          todaysSchedule.assignments.length === 0 ? (
            <p className="text-gray-500">
              No classes or assignments due today.
            </p>
          ) : (
            <>
              {todaysSchedule.classes.length > 0 && (
                <>
                  <h3 className="font-semibold text-blue-800 mb-2">Classes</h3>
                  <ul className="space-y-2 mb-4">
                    {todaysSchedule.classes.map((cls, idx) => (
                      <li key={idx} className="flex items-center gap-4">
                        <FaBook className="text-blue-500" />
                        <span className="font-medium">{cls.name}</span>
                        <span className="text-gray-500">{cls.schedule}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {todaysSchedule.assignments.length > 0 && (
                <>
                  <h3 className="font-semibold text-purple-800 mb-2">
                    Assignments Due
                  </h3>
                  <ul className="space-y-2">
                    {todaysSchedule.assignments.map((a, idx) => (
                      <li key={idx} className="flex items-center gap-4">
                        <FaClipboardList className="text-purple-500" />
                        <span className="font-medium">{a.title}</span>
                        <span className="text-gray-500">
                          {a.due_date?.split("T")[1] || "Today"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
        {/* Recent Activities and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Activities
              </h2>
              <FaBell className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        New assignment: {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </div>
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Quick Actions
              </h2>
              <FaChartLine className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                onClick={() => setShowAssignmentModal(true)}
              >
                Create New Assignment
              </button>
              <button
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                onClick={() => setShowAttendanceModal(true)}
              >
                Take Attendance
              </button>
              <button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors"
                onClick={() => setShowGradeModal(true)}
              >
                Grade Assignment
              </button>
              <button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors"
                onClick={() => setShowReportModal(true)}
              >
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Charts Section: Performance, Completion, etc. */}
      <div>
        {/* Student Performance Area Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Student Performance (Avg Grade Over Time)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={performanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="average_grade"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorGrade)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Assignment Completion Ladder Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Assignment Completion (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={completionData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="completion"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modals: */}
      {showAssignmentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <AssignmentForm
              onClose={() => setShowAssignmentModal(false)}
              onSuccess={() => setShowAssignmentModal(false)}
            />
          </div>
        </div>
      )}
      {showAttendanceModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <AttendanceForm
              user={user}
              onClose={() => setShowAttendanceModal(false)}
              onSuccess={() => setShowAttendanceModal(false)}
            />
          </div>
        </div>
      )}
      {showGradeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Grade Assignment</h2>
            {modalError && (
              <div className="text-red-500 mb-2">{modalError}</div>
            )}
            <select
              className="border p-2 w-full mb-2"
              value={gradeAssignment}
              onChange={(e) => setGradeAssignment(e.target.value)}
            >
              <option value="">Select Assignment</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <select
              className="border p-2 w-full mb-2"
              value={gradeStudent}
              onChange={(e) => setGradeStudent(e.target.value)}
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
            <input
              className="border p-2 w-full mb-4"
              placeholder="Grade"
              value={gradeValue}
              onChange={(e) => setGradeValue(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={async () => {
                  setModalError("");
                  if (!gradeAssignment || !gradeStudent || !gradeValue) {
                    setModalError("Fill all fields");
                    return;
                  }
                  setModalLoading(true);
                  try {
                    await updateAssignmentSubmissionGrade(gradeStudent, {
                      grade: gradeValue,
                    });
                    setShowGradeModal(false);
                    setGradeAssignment("");
                    setGradeStudent("");
                    setGradeValue("");
                    alert("Grade saved!");
                  } catch (e) {
                    setModalError("Failed to save grade.");
                  }
                  setModalLoading(false);
                }}
                disabled={modalLoading}
              >
                Save
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setShowGradeModal(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
            </div>
            {modalLoading && (
              <div className="text-blue-500 mt-2">Saving...</div>
            )}
          </div>
        </div>
      )}
      {showReportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">View Reports</h2>
            <select
              className="border p-2 w-full mb-4"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="attendance">Attendance</option>
              <option value="grades">Grades</option>
              <option value="assignments">Assignments</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={async () => {
                  setModalLoading(true);
                  setModalError("");
                  try {
                    // Example: fetch and display report data
                    let data = [];
                    if (reportType === "attendance")
                      data = await fetchAttendance();
                    else if (reportType === "grades")
                      data = await fetchAssignments();
                    // Replace with actual grades fetch
                    else if (reportType === "assignments")
                      data = await fetchAssignments();
                    setReportData(data);
                  } catch (e) {
                    setModalError("Failed to fetch report.");
                  }
                  setModalLoading(false);
                }}
                disabled={modalLoading}
              >
                View
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setShowReportModal(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
            </div>
            {modalLoading && (
              <div className="text-blue-500 mt-2">Loading...</div>
            )}
            {modalError && (
              <div className="text-red-500 mt-2">{modalError}</div>
            )}
            {/* Display report data as a table */}
            {reportData.length > 0 && (
              <div className="mt-4 max-h-48 overflow-y-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr>
                      {Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="border px-2 py-1">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="border px-2 py-1">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMainDashboard;
