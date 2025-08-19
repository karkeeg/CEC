import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getClassesByTeacher,
  fetchStudents,
  getStudentCountByClass,
  getStudentsByClass,
  removeStudentFromClass,
  updateClass,
  fetchSubjects,
  fetchDepartments,
} from "../../supabaseConfig/supabaseApi";
import {
  FaUsers,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBook,
  FaChartBar,
  FaGraduationCap,
} from "react-icons/fa";
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
  BarChart,
  Bar,
} from "recharts";
import ManageEnrollmentForm from "../Forms/ManageEnrollmentForm";
import ClassForm from "../Forms/ClassForm";
import Modal from "../Modal";
import Loader from "../Loader";

// Cache keys for localStorage
const CACHE_KEYS = {
  CLASSES: 'teacher_classes_cache',
  CHART_DATA: 'teacher_classes_chart_data',
  CACHE_TIMESTAMP: 'teacher_classes_timestamp'
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const TeacherClasses = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classSizeTrend, setClassSizeTrend] = useState([]); // For AreaChart
  const [classFillStatus, setClassFillStatus] = useState([]); // For StepLine
  const [enrollmentModalClassId, setEnrollmentModalClassId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [detailsModalClass, setDetailsModalClass] = useState(null);
  const [detailsModalStudents, setDetailsModalStudents] = useState([]);

  // Check if cached data is still valid
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  };

  // Load data from cache
  const loadFromCache = () => {
    try {
      const cachedClasses = localStorage.getItem(CACHE_KEYS.CLASSES);
      const cachedChartData = localStorage.getItem(CACHE_KEYS.CHART_DATA);
      
      if (cachedClasses && cachedChartData) {
        const classesData = JSON.parse(cachedClasses);
        const chartData = JSON.parse(cachedChartData);
        
        setClasses(classesData);
        setClassSizeTrend(chartData.classSizeTrend || []);
        setClassFillStatus(chartData.classFillStatus || []);
        
        return true;
      }
    } catch (error) {
      console.error("Error loading classes cache:", error);
    }
    return false;
  };

  // Save data to cache
  const saveToCache = (classesData, chartData) => {
    try {
      localStorage.setItem(CACHE_KEYS.CLASSES, JSON.stringify(classesData));
      localStorage.setItem(CACHE_KEYS.CHART_DATA, JSON.stringify(chartData));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error("Error saving classes cache:", error);
    }
  };
  const [detailsModalLoading, setDetailsModalLoading] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [editCapacity, setEditCapacity] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    // Try to load from cache first
    if (isCacheValid() && loadFromCache()) {
      setLoading(false);
      return;
    }

    // If no valid cache, fetch fresh data
    fetchClasses();
  }, [user?.id, refresh]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const [classesData, subjectsData, departmentsData] = await Promise.all([
        getClassesByTeacher(user.id),
        fetchSubjects(),
        fetchDepartments(),
      ]);

      // For each class, fetch the enrolled count from student_classes
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (cls) => {
          const studentCount = await getStudentCountByClass(
            cls.class_id || cls.id
          );
          return { ...cls, studentCount };
        })
      );
      setClasses(classesWithCounts);
      setSubjects(subjectsData || []);
      setDepartments(departmentsData || []);

      // Generate chart data
      const sizeTrend = classesWithCounts.map((cls) => ({
        name: cls.name || cls.class_name,
        students: cls.studentCount,
        capacity: cls.max_students || cls.capacity || 30,
      }));
      setClassSizeTrend(sizeTrend);

      const fillStatus = classesWithCounts.map((cls) => ({
        name: cls.name || cls.class_name,
        fillPercentage: Math.round(
          (cls.studentCount / (cls.max_students || cls.capacity || 30)) * 100
        ),
      }));
      setClassFillStatus(fillStatus);

      // Save to cache
      const chartData = {
        classSizeTrend: sizeTrend,
        classFillStatus: fillStatus
      };
      saveToCache(classesWithCounts, chartData);
      
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClassStatus = (studentCount, capacity) => {
    const percentage = (studentCount / capacity) * 100;
    if (percentage >= 90)
      return { text: "Full", color: "bg-red-100 text-red-800" };
    if (percentage >= 75)
      return { text: "Almost Full", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Available", color: "bg-green-100 text-green-800" };
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find((d) => d.id === departmentId);
    return department ? department.name : departmentId;
  };

  // Demo data for weekly class schedule (number of classes per weekday)
  const weeklyClassData = [
    { day: "Mon", classes: 3 },
    { day: "Tue", classes: 2 },
    { day: "Wed", classes: 4 },
    { day: "Thu", classes: 1 },
    { day: "Fri", classes: 3 },
    { day: "Sat", classes: 0 },
    { day: "Sun", classes: 0 },
  ];

  // Demo data for class time distribution (number of classes per time slot)
  const classTimeData = [
    { time: "8:00", count: 1 },
    { time: "9:00", count: 2 },
    { time: "10:00", count: 3 },
    { time: "11:00", count: 2 },
    { time: "12:00", count: 1 },
    { time: "13:00", count: 0 },
    { time: "14:00", count: 1 },
    { time: "15:00", count: 2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading classes data..." />
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-w-0">
      {/* Add Class Button */}
      {/* <div className="mb-4 flex justify-end">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
          onClick={() => setShowAddClassModal(true)}
        >
          + Add Class
        </button>
      </div> */}
      {/* Summary Section: Summary Cards */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Class Overview
        </h2>
        <p className="text-gray-600 mb-6">
          Quick stats about your teaching assignments, student counts, and
          departments.
        </p>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 min-w-0">
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {classes.length}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <FaBook className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {classes.reduce(
                    (sum, cls) => sum + (Number(cls.studentCount) || 0),
                    0
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <FaUsers className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Average Class Size
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {classes.length > 0
                    ? Math.round(
                        classes.reduce(
                          (sum, cls) => sum + (Number(cls.studentCount) || 0),
                          0
                        ) / classes.length
                      )
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <FaChartBar className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Departments</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {new Set(classes.map((cls) => cls.department)).size}
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <FaGraduationCap className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Classes Grid Section - moved to top */}
      <div className="mb-10 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
            onClick={() => setShowAddClassModal(true)}
          >
            + Add Class
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Below is a list of all the classes you are currently teaching. You can
          view details, manage enrollments, and monitor class status at a
          glance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          {classes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 text-lg">No classes found</div>
              <p className="text-gray-400 mt-2">
                You haven't been assigned to any classes yet.
              </p>
            </div>
          ) : (
            classes.map((cls, index) => {
              const status = getClassStatus(
                cls.studentCount,
                cls.capacity || 30
              );
              return (
                <div
                  key={index}
                  className="bg-blue-100 rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {cls.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                      >
                        {status.text}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {cls.description || "No description available"}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="mr-2 text-gray-400" />
                        <span>
                          {cls.studentCount} / {cls.capacity} students
                        </span>
                      </div>

                      {cls.schedule && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaClock className="mr-2 text-gray-400" />
                          <span>{cls.schedule}</span>
                        </div>
                      )}

                      {cls.room && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" />
                          <span>Room {cls.room}</span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <FaGraduationCap className="mr-2 text-gray-400" />
                        <span>{cls.department}</span>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar with Tooltip, Color, Label, and Icon */}
                    {(() => {
                      const percent = Math.round(
                        ((Number(cls.studentCount) || 0) /
                          (Number(cls.capacity) || 30)) *
                          100
                      );
                      let barColor = "bg-green-500";
                      let statusLabel = "Seats Available";
                      let icon = (
                        <FaUsers className="text-green-500 text-xs ml-1" />
                      );
                      if (percent >= 90) {
                        barColor = "bg-red-500";
                        statusLabel = "Class Full";
                        icon = (
                          <FaUsers className="text-red-500 text-xs ml-1" />
                        );
                      } else if (percent >= 75) {
                        barColor = "bg-yellow-500";
                        statusLabel = "Almost Full";
                        icon = (
                          <FaUsers className="text-yellow-500 text-xs ml-1" />
                        );
                      }
                      return (
                        <div className="w-full mt-6 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center group relative">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3 overflow-hidden">
                              <div
                                className={`${barColor} h-2 rounded-full transition-all duration-700`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="ml-1 text-xs text-gray-700 flex items-center font-semibold">
                              {percent}% {icon}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-black text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                              {`${cls.studentCount} of ${
                                cls.capacity || 30
                              } students enrolled`}
                            </div>
                          </div>
                          <div className="text-xs text-center mt-2 font-medium text-gray-600">
                            {statusLabel}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-4 flex space-x-2">
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-semibold transition-colors"
                        onClick={async () => {
                          setDetailsModalClass(cls);
                          setEditCapacity(cls.capacity);
                          setDetailsModalLoading(true);
                          const students = await getStudentsByClass(
                            cls.class_id || cls.id
                          );
                          setDetailsModalStudents(students || []);
                          setDetailsModalLoading(false);
                        }}
                      >
                        View Class Details
                      </button>
                      <button
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-semibold transition-colors"
                        onClick={() => {
                          console.log(
                            "Clicked Manage Enrollments for class",
                            cls.id
                          );
                          setEnrollmentModalClassId(cls.class_id);
                        }}
                      >
                        Manage Enrollments
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Charts Section: Class Size Trend, Fill Status */}
      <div className="mb-8 min-w-0">
        {/* Class Size Trend Area Chart */}
        <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow mb-8 min-w-0 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Class Size Trend (Mountain Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={classSizeTrend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                label={{
                  value: "Classes ->",
                  position: "bottom",
                  offset: -20,
                }}
                tick={false}
              />
              <YAxis
                label={{
                  value: "Class size (no of Students)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="size"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorSize)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Class Fill Status Ladder Chart */}
        <div className="bg-blue-100 p-3 sm:p-6 rounded-xl shadow mb-8 min-w-0 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Class Fill Status (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={classFillStatus}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                label={{
                  value: "Classes ->",
                  position: "bottom",
                  offset: -20,
                }}
                tick={false}
              />
              <YAxis
                label={{
                  value: "Class Capacity",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="fill"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Enrollment Modal */}
      {enrollmentModalClassId && (
        <Modal
          title="Manage Enrollment"
          onClose={() => setEnrollmentModalClassId(null)}
        >
          <ManageEnrollmentForm
            user={user}
            classId={enrollmentModalClassId}
            classYear={
              classes.find(
                (c) =>
                  c.class_id === enrollmentModalClassId ||
                  c.id === enrollmentModalClassId
              )?.year
            }
            classCapacity={
              classes.find(
                (c) =>
                  c.class_id === enrollmentModalClassId ||
                  c.id === enrollmentModalClassId
              )?.capacity
            }
            currentEnrolled={
              classes.find(
                (c) =>
                  c.class_id === enrollmentModalClassId ||
                  c.id === enrollmentModalClassId
              )?.studentCount
            }
            onClose={() => setEnrollmentModalClassId(null)}
            onSuccess={() => {
              setEnrollmentModalClassId(null);
              setRefresh((r) => !r);
            }}
          />
        </Modal>
      )}
      {showAddClassModal && (
        <Modal title="Add Class" onClose={() => setShowAddClassModal(false)}>
          <ClassForm
            user={user}
            onClose={() => setShowAddClassModal(false)}
            onSuccess={() => {
              setShowAddClassModal(false);
              setRefresh((r) => !r);
            }}
          />
        </Modal>
      )}
      {detailsModalClass && (
        <Modal title="Class Details" onClose={() => setDetailsModalClass(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            <div>
              <strong>Name:</strong> {detailsModalClass.name}
            </div>
            <div>
              <strong>Year:</strong> {detailsModalClass.year}
            </div>
            <div>
              <strong>Semester:</strong> {detailsModalClass.semester}
            </div>
            <div>
              <strong>Room:</strong> {detailsModalClass.room_no}
            </div>
            <div>
              <strong>Capacity:</strong>{" "}
              {editCapacity !== null ? (
                <>
                  <input
                    type="number"
                    min="1"
                    className="border px-2 py-1 rounded w-20 mr-2"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                  />
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                    onClick={async () => {
                      await updateClass(
                        detailsModalClass.class_id || detailsModalClass.id,
                        { capacity: Number(editCapacity) }
                      );
                      setEditCapacity(null);
                      setRefresh((r) => !r);
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="ml-2 text-xs text-gray-500 hover:text-gray-800"
                    onClick={() => setEditCapacity(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {detailsModalClass.capacity}
                  <button
                    className="ml-2 text-xs text-blue-600 underline"
                    onClick={() => setEditCapacity(detailsModalClass.capacity)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            <div>
              <strong>Subject:</strong>{" "}
              {getSubjectName(detailsModalClass.subject_id)}
            </div>
            <div>
              <strong>Schedule:</strong> {detailsModalClass.schedule}
            </div>
            <div>
              <strong>Description:</strong> {detailsModalClass.description}
            </div>
            <div>
              <strong>Department:</strong>{" "}
              {getDepartmentName(detailsModalClass.department_id)}
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 mt-4">Enrolled Students</h3>
          {detailsModalLoading ? (
            <div>Loading students...</div>
          ) : detailsModalStudents.length === 0 ? (
            <div className="text-gray-500">
              No students enrolled in this class.
            </div>
          ) : (
            <div className="w-full max-h-64 overflow-y-auto border rounded mb-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailsModalStudents.map((s) => (
                    <tr key={s.student.id}>
                      <td className="px-4 py-2">
                        {s.student.first_name} {s.student.middle_name || ""}{" "}
                        {s.student.last_name}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Remove this student from the class?"
                              )
                            )
                              return;
                            await removeStudentFromClass(
                              s.student.id,
                              detailsModalClass.class_id || detailsModalClass.id
                            );
                            // Refresh student list
                            setDetailsModalLoading(true);
                            const students = await getStudentsByClass(
                              detailsModalClass.class_id || detailsModalClass.id
                            );
                            setDetailsModalStudents(students || []);
                            setDetailsModalLoading(false);
                            setRefresh((r) => !r);
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default TeacherClasses;
