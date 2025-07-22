import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getAllStudents,
  getAllAssignments,
  getGradesByTeacher,
  fetchStudents,
  fetchAssignments,
  getSubjects,
  updateAssignmentSubmissionGrade,
  getClassesByTeacher,
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
import AttendanceForm from "./AttendanceForm";

const TeacherMainDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [completionData, setCompletionData] = useState([]);
  const [todaysSchedule, setTodaysSchedule] = useState({
    classes: [],
    assignments: [],
  });

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [reportType, setReportType] = useState("assignment");

  useEffect(() => {
    fetchStudents();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    const fetchDashboardData = async () => {
      try {
        const [studentsData, assignmentsData, teacherClasses] =
          await Promise.all([
            getAllStudents(),
            getAllAssignments(),
            getClassesByTeacher(user.id),
          ]);
        setStats({
          totalStudents: studentsData?.length || 0,
          totalClasses: teacherClasses?.length || 0,
          totalAssignments: assignmentsData?.length || 0,
          attendanceRate: 85,
        });
        const teacherAssignments = (assignmentsData || [])
          .filter((a) => a.teacher_id === user.id)
          .slice(0, 5);
        setRecentActivities(teacherAssignments || []);
        const gradesData = await getGradesByTeacher(user.id);
        setPerformanceData(gradesData || []);
        const completion = (assignmentsData || [])
          .filter((a) => a.teacher_id === user.id)
          .map((a) => ({
            name: a.title,
            completion: a.total_count
              ? Math.round((a.completed_count / a.total_count) * 100)
              : 0,
          }));
        setCompletionData(completion);
        const today = new Date().toISOString().split("T")[0];
        const todaysClasses = (teacherClasses || []).filter(
          (c) =>
            c.teacher_id === user.id &&
            c.schedule &&
            c.schedule.split("T")[0] === today
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
        {!user?.id && (
          <div className="text-center text-gray-500 mt-8">Loading user...</div>
        )}
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
                (showAllActivities
                  ? recentActivities
                  : recentActivities.slice(0, 5)
                ).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
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
              {recentActivities.length > 5 && (
                <button
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={() => setShowAllActivities((prev) => !prev)}
                >
                  {showAllActivities ? "See Less" : "See More"}
                </button>
              )}
              {/* Activity Detail Modal */}
              {selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl"
                      onClick={() => setSelectedActivity(null)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h3 className="text-xl font-bold mb-4">Activity Details</h3>
                    <div className="mb-2">
                      <strong>Title:</strong> {selectedActivity.title}
                    </div>
                    <div className="mb-2">
                      <strong>Date:</strong>{" "}
                      {new Date(selectedActivity.created_at).toLocaleString()}
                    </div>
                    {/* Add more details here if available in selectedActivity */}
                  </div>
                </div>
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
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors"
                onClick={() => setShowReportModal(true)}
              >
                View Report
              </button>
              <button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors"
                onClick={() => setShowGradeModal(true)}
              >
                Grade Assignments
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

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Assignment</h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>
            <AssignmentForm
              onClose={() => setShowAssignmentModal(false)}
              onSuccess={() => setShowAssignmentModal(false)}
            />
          </div>
        </div>
      )}
      {/* Attendance Modal */}
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
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {reportType === "assignment"
                  ? "Assignment Report"
                  : reportType === "grades"
                  ? "Grades Report"
                  : "Attendance Report"}
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>
            <select
              className="w-full bg-yellow-100 text-gray-800 py-2 px-4 rounded-md transition-colors mb-4"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="assignment">Assignment Report</option>
              <option value="grades">Grades Report</option>
              <option value="attendance">Attendance Report</option>
            </select>
            {reportType === "assignment" && (
              <div>Assignment Report Placeholder</div>
            )}
            {reportType === "grades" && <div>Grades Report Placeholder</div>}
            {reportType === "attendance" && (
              <div>Attendance Report Placeholder</div>
            )}
          </div>
        </div>
      )}
      {/* Grade Assignments Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            {/* Replace with your actual grade assignments component */}
            <GradeAssignments onClose={() => setShowGradeModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMainDashboard;
