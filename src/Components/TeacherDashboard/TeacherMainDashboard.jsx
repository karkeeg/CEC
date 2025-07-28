import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getGradesByTeacher,
  fetchStudents,
  fetchAssignments,
  getSubjects,
  updateAssignmentSubmissionGrade,
  getClassesByTeacher,
  getAssignmentsByTeacher,
  fetchAttendance,
  getAttendanceByClassAndDate,
  getStudentsByClass,
  fetchAssignmentSubmissions,
  getGradeBySubmissionId,
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
import GradeAssignmentsModal from "../Forms/GradeAssignmentsModal";
import Modal from "../Modal";
import Loader from "../Loader";

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
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportData, setReportData] = useState({
    assignmentDetails: [],
    gradeDetails: [],
    attendanceDetails: [],
    classDetails: [],
  });
  const [reportLoading, setReportLoading] = useState(false);

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
        const [assignmentsData, teacherClasses, attendanceRecords] =
          await Promise.all([
            getAssignmentsByTeacher(user.id),
            getClassesByTeacher(user.id),
            fetchAttendance({ teacher_id: user.id }),
          ]);

        // Set state variables for use in reports
        setTeacherAssignments(assignmentsData || []);
        setAttendanceData(attendanceRecords || []);

        // Get students for teacher's classes
        let studentsInTeacherClasses = 0;
        if (teacherClasses && teacherClasses.length > 0) {
          const classIds = teacherClasses.map((cls) => cls.class_id || cls.id);
          // Get students for each class
          const studentsPromises = classIds.map((classId) =>
            import("../../supabaseConfig/supabaseApi").then((api) =>
              api.getStudentsByClass(classId)
            )
          );
          const studentsResults = await Promise.all(studentsPromises);
          const allStudents = studentsResults.flat();
          studentsInTeacherClasses = allStudents.length;
        }

        // Calculate attendance rate from actual data
        let attendanceRate = 0;
        if (attendanceRecords && attendanceRecords.length > 0) {
          const totalRecords = attendanceRecords.length;
          const presentRecords = attendanceRecords.filter(
            (record) => record.status === "present"
          ).length;
          attendanceRate = Math.round((presentRecords / totalRecords) * 100);
        }

        setStats({
          totalStudents: studentsInTeacherClasses,
          totalClasses: teacherClasses?.length || 0,
          totalAssignments: assignmentsData?.length || 0,
          attendanceRate: attendanceRate,
        });

        const recentTeacherAssignments = (assignmentsData || []).slice(0, 3);
        setRecentActivities(recentTeacherAssignments || []);
        const gradesData = await getGradesByTeacher(user.id);
        setPerformanceData(gradesData || []);
        const completion = (assignmentsData || []).map((a) => ({
          name: a.title,
          completion: a.total_count
            ? Math.round((a.completed_count / a.total_count) * 100)
            : 0,
        }));
        setCompletionData(completion);
        const today = new Date().toISOString().split("T")[0];

        // Fix today's classes filtering - check if schedule contains today's date
        const todaysClasses = (teacherClasses || []).filter((c) => {
          if (!c.schedule) return false;

          // Handle different schedule formats
          const scheduleDate = c.schedule.includes("T")
            ? c.schedule.split("T")[0]
            : c.schedule;

          return scheduleDate === today;
        });

        // Fix today's assignments filtering
        const todaysAssignments = (assignmentsData || []).filter((a) => {
          if (!a.due_date) return false;

          const dueDate = a.due_date.includes("T")
            ? a.due_date.split("T")[0]
            : a.due_date;

          return dueDate === today;
        });
        // Debug schedule data
        console.log("Today:", today);
        console.log("Teacher Classes:", teacherClasses);
        console.log("Today's Classes:", todaysClasses);
        console.log("Today's Assignments:", todaysAssignments);

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

  const fetchReportData = async (type) => {
    if (!user?.id) return;

    setReportLoading(true);
    try {
      switch (type) {
        case "assignment":
          // Fetch detailed assignment data with submissions
          const assignmentDetails = await Promise.all(
            teacherAssignments.map(async (assignment) => {
              const submissions = await fetchAssignmentSubmissions(
                assignment.id
              );
              const gradedSubmissions =
                submissions?.filter((s) => s.grade) || [];
              const totalSubmissions = submissions?.length || 0;
              const gradedCount = gradedSubmissions.length;

              return {
                ...assignment,
                submissions: submissions || [],
                submissionRate:
                  totalSubmissions > 0
                    ? Math.round(
                        (submissions.filter((s) => s.submitted).length /
                          totalSubmissions) *
                          100
                      )
                    : 0,
                gradedRate:
                  totalSubmissions > 0
                    ? Math.round((gradedCount / totalSubmissions) * 100)
                    : 0,
                averageGrade:
                  gradedCount > 0
                    ? Math.round(
                        gradedSubmissions.reduce(
                          (sum, s) => sum + (s.grade?.grade || 0),
                          0
                        ) / gradedCount
                      )
                    : 0,
              };
            })
          );
          setReportData((prev) => ({ ...prev, assignmentDetails }));
          break;

        case "grades":
          // Use the provided grades data
          const gradesData = [
            {
              id: "4fe1f3be-9803-4486-a84f-010df53b86fd",
              submission_id: "c27acef7-dbcc-4d1f-94a5-31f4a0fd026a",
              grade: 69,
              feedback:
                "⭐⭐ Your work needs improvement. Consider seeking additional help to better understand the concepts.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "875625e6-c49c-46df-bfb9-d9b3a18ddf64",
              rating: "2.0",
            },
            {
              id: "82cd5ddd-58f5-4036-bcb9-c3964cea8813",
              submission_id: "2a0d63fe-5faa-49a2-a665-46e1548197c5",
              grade: 77,
              feedback:
                "⭐⭐⭐ Good effort! Consider strengthening your analysis and arguments for better results.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "e9195524-6f28-4857-8626-c2cd98d5804d",
              rating: "3.0",
            },
            {
              id: "cc6f7a15-de67-43d7-9f1d-8c0550420eea",
              submission_id: "36624547-78b8-44b6-aa98-543f682c05fb",
              grade: 66,
              feedback:
                "⭐⭐ Below average work. Please review the course materials and improve your understanding.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "6d1fd06f-44d9-4e9e-bbc6-15783782e581",
              rating: "2.0",
            },
            {
              id: "d454e1eb-b274-4e5b-b7c2-6a59176be0b0",
              submission_id: "9c7177d4-4329-4238-9da3-711eb0632142",
              grade: 75,
              feedback:
                "⭐⭐⭐ Satisfactory work. Your submission meets requirements with room for improvement.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "a0dcc0b5-c9bb-4939-bd40-6e80c9d6180c",
              rating: "3.0",
            },
            {
              id: "1297c18f-3984-443e-a82c-0fe5990d6166",
              submission_id: "01fae518-99cc-4c28-9525-7c1b473bf813",
              grade: 86,
              feedback:
                "⭐⭐⭐⭐ Great job! Your work shows excellent grasp of the material with room for minor improvements.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "9885a2b6-abaa-49d0-8876-4a229cf5b014",
              rating: "4.0",
            },
            {
              id: "698b024e-bf29-4e31-86ee-c299d2886183",
              submission_id: "09c50108-93de-4859-983b-a4dbe742e448",
              grade: 63,
              feedback:
                "⭐⭐ Your work requires substantial improvement. Consider meeting with me during office hours.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "0e188b22-15cc-4273-a2d1-9b936e904f57",
              rating: "1.5",
            },
            {
              id: "cdfc6f66-6540-49f1-89a3-43fd4000ae84",
              submission_id: "76ea5dc0-573a-41ea-8e1b-2682643cf20c",
              grade: 96,
              feedback:
                "⭐⭐⭐⭐⭐ Outstanding work! Exceptional understanding and execution. This is exemplary work!",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "0e188b22-15cc-4273-a2d1-9b936e904f57",
              rating: "5.0",
            },
            {
              id: "c46f71e5-bf52-462f-a4cb-a3d53bf14951",
              submission_id: "30d4aeeb-c082-4f99-be73-35717fe858c4",
              grade: 78,
              feedback:
                "⭐⭐⭐ Satisfactory work. Your submission meets requirements with room for improvement.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "6d1fd06f-44d9-4e9e-bbc6-15783782e581",
              rating: "3.0",
            },
            {
              id: "4e582bec-d30d-4496-b99a-de265e8e17f6",
              submission_id: "9e463bdb-e20f-4c19-adc0-0999928e5eac",
              grade: 99,
              feedback:
                "⭐⭐⭐⭐⭐ Perfect submission! Your analysis is brilliant and demonstrates mastery of the subject.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "e9195524-6f28-4857-8626-c2cd98d5804d",
              rating: "5.0",
            },
            {
              id: "dc77fc9d-e41e-4164-85f4-fd10fcbd5c2d",
              submission_id: "446c8557-42d3-4d7f-92eb-49e8e4ea0735",
              grade: 80,
              feedback:
                "⭐⭐⭐ Satisfactory work. Your submission meets requirements with room for improvement.",
              rated_at: "2025-07-27 11:32:09.122273",
              rated_by: "b12953f2-7c6a-404f-819d-161a1af413e7",
              rating: "3.0",
            },
          ];

          setReportData((prev) => ({ ...prev, gradeDetails: gradesData }));
          break;

        case "attendance":
          // Fetch detailed attendance data by class
          const teacherClasses = await getClassesByTeacher(user.id);
          const attendanceDetails = await Promise.all(
            teacherClasses.map(async (cls) => {
              const classAttendance = attendanceData.filter(
                (record) => record.class_id === (cls.class_id || cls.id)
              );
              const students = await getStudentsByClass(cls.class_id || cls.id);
              return {
                class: cls,
                attendance: classAttendance,
                students: students || [],
                attendanceRate:
                  classAttendance.length > 0
                    ? Math.round(
                        (classAttendance.filter(
                          (record) => record.status === "present"
                        ).length /
                          classAttendance.length) *
                          100
                      )
                    : 0,
              };
            })
          );
          setReportData((prev) => ({ ...prev, attendanceDetails }));
          break;
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setReportLoading(false);
    }
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
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading teacher main dashboard data..." />
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-w-0">
      {/* Summary Section: Stat Cards, Schedule, Recent Activities, Quick Actions */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          See Our Dashboard {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today.
        </p>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-4 mb-8 min-w-0">
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
        <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow mb-8 min-w-0 overflow-x-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Activities
              </h2>
              <FaBell className="text-gray-400" />
            </div>
            <div className="space-y-4 min-w-0">
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
              {teacherAssignments.length > 3 && (
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
          <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Quick Actions
              </h2>
              <FaChartLine className="text-gray-400" />
            </div>
            <div className="space-y-3 min-w-0">
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
                onClick={() => {
                  setShowReportModal(true);
                  fetchReportData(reportType);
                }}
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
        {/* <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow mb-8 min-w-0 overflow-x-auto">
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
        </div> */}
        {/* Assignment Completion Ladder Chart */}
        {/* <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow mb-8 min-w-0 overflow-x-auto">
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
        </div> */}
      </div>

      {showAssignmentModal && (
        <Modal
          title="Create New Assignment"
          onClose={() => setShowAssignmentModal(false)}
        >
          <AssignmentForm
            onClose={() => setShowAssignmentModal(false)}
            onSuccess={() => setShowAssignmentModal(false)}
          />
        </Modal>
      )}
      {showAttendanceModal && (
        <Modal
          title="Take Attendance"
          onClose={() => setShowAttendanceModal(false)}
        >
          <AttendanceForm
            user={user}
            onClose={() => setShowAttendanceModal(false)}
            onSuccess={() => setShowAttendanceModal(false)}
          />
        </Modal>
      )}
      {showReportModal && (
        <Modal
          title={
            reportType === "assignment"
              ? "Assignment Report"
              : reportType === "grades"
              ? "Grades Report"
              : "Attendance Report"
          }
          onClose={() => setShowReportModal(false)}
        >
          <div className="space-y-4">
            <select
              className="w-full bg-yellow-100 text-gray-800 py-2 px-4 rounded-md transition-colors mb-4"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                fetchReportData(e.target.value);
              }}
            >
              <option value="assignment">Assignment Report</option>
              <option value="grades">Grades Report</option>
              <option value="attendance">Attendance Report</option>
            </select>
            {reportType === "assignment" && (
              <div className="space-y-4">
                {reportLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                      Loading assignment data...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800">
                          Total Assignments
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {teacherAssignments?.length || 0}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800">
                          Submission Rate
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {reportData.assignmentDetails.length > 0
                            ? Math.round(
                                reportData.assignmentDetails.reduce(
                                  (sum, a) => sum + a.submissionRate,
                                  0
                                ) / reportData.assignmentDetails.length
                              )
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-800">
                          Avg Grade
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {reportData.assignmentDetails.length > 0
                            ? Math.round(
                                reportData.assignmentDetails.reduce(
                                  (sum, a) => sum + a.averageGrade,
                                  0
                                ) / reportData.assignmentDetails.length
                              )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">
                        Key Assignment Metrics
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {reportData.assignmentDetails.map(
                          (assignment, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-800">
                                  {assignment.title}
                                </h4>
                                <span
                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                    assignment.averageGrade >= 80
                                      ? "bg-green-100 text-green-800"
                                      : assignment.averageGrade >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {assignment.averageGrade || 0}%
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Due:</span>
                                  <span className="ml-2">
                                    {new Date(
                                      assignment.due_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Submissions:
                                  </span>
                                  <span className="ml-2">
                                    {assignment.submissions.length}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Rate:</span>
                                  <span className="ml-2">
                                    {assignment.submissionRate}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {reportType === "grades" && (
              <div className="space-y-4">
                {reportLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading grade data...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-800">
                          Total Grades
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {reportData.gradeDetails.length}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800">
                          Average Grade
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {reportData.gradeDetails.length > 0
                            ? Math.round(
                                reportData.gradeDetails.reduce(
                                  (sum, item) => sum + (item.grade || 0),
                                  0
                                ) / reportData.gradeDetails.length
                              )
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800">
                          Avg Rating
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {reportData.gradeDetails.length > 0
                            ? (
                                reportData.gradeDetails.reduce(
                                  (sum, item) =>
                                    sum + parseFloat(item.rating || 0),
                                  0
                                ) / reportData.gradeDetails.length
                              ).toFixed(1)
                            : 0}
                          ⭐
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-orange-800">
                          Excellence Rate
                        </h3>
                        <p className="text-2xl font-bold text-orange-600">
                          {reportData.gradeDetails.length > 0
                            ? Math.round(
                                (reportData.gradeDetails.filter(
                                  (item) => item.grade >= 90
                                ).length /
                                  reportData.gradeDetails.length) *
                                  100
                              )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Grade Details</h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {reportData.gradeDetails.map((grade, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-800">
                                Grade #{grade.id.slice(-8)}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-yellow-500 text-lg">
                                  {grade.rating}⭐
                                </span>
                                <span
                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                    grade.grade >= 80
                                      ? "bg-green-100 text-green-800"
                                      : grade.grade >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {grade.grade || 0}%
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Feedback:</span>
                                <p className="mt-1 text-gray-800">
                                  {grade.feedback || "No feedback provided"}
                                </p>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                  Rated:{" "}
                                  {new Date(
                                    grade.rated_at
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  {grade.grade >= 90
                                    ? "Outstanding"
                                    : grade.grade >= 80
                                    ? "Excellent"
                                    : grade.grade >= 70
                                    ? "Good"
                                    : grade.grade >= 60
                                    ? "Satisfactory"
                                    : "Needs Improvement"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {reportType === "attendance" && (
              <div className="space-y-4">
                {reportLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                      Loading attendance data...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800">
                          Present
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {attendanceData?.filter(
                            (record) => record.status === "present"
                          ).length || 0}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-red-800">Absent</h3>
                        <p className="text-2xl font-bold text-red-600">
                          {attendanceData?.filter(
                            (record) => record.status === "absent"
                          ).length || 0}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-yellow-800">Late</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {attendanceData?.filter(
                            (record) => record.status === "late"
                          ).length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">
                        Class-wise Attendance
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {reportData.attendanceDetails.map(
                          (classData, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-800">
                                  {classData.class.name}
                                </h4>
                                <span
                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                    classData.attendanceRate >= 80
                                      ? "bg-green-100 text-green-800"
                                      : classData.attendanceRate >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {classData.attendanceRate}%
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">
                                    Students:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {classData.students.length}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Records:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {classData.attendance.length}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Present:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {
                                      classData.attendance.filter(
                                        (r) => r.status === "present"
                                      ).length
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
      {showGradeModal && (
        <Modal
          title="Grade Assignments"
          onClose={() => setShowGradeModal(false)}
        >
          <GradeAssignmentsModal
            user={user}
            onClose={() => setShowGradeModal(false)}
            onGradeUpdate={() => {
              // Refresh dashboard data when grades are updated
              fetchDashboardData();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default TeacherMainDashboard;
