import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getClassesByTeacher,
  fetchStudents,
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

const TeacherClasses = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classSizeTrend, setClassSizeTrend] = useState([]); // For AreaChart
  const [classFillStatus, setClassFillStatus] = useState([]); // For StepLine
  const [enrollmentModalClassId, setEnrollmentModalClassId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const classes = await getClassesByTeacher(user.id);
        const allStudents = await fetchStudents();
        const classesWithCounts = (classes || []).map((cls) => {
          const count = allStudents.filter(
            (s) => s.class_id === cls.class_id
          ).length;
          return { ...cls, studentCount: count };
        });
        setClasses(classesWithCounts);
        // Update trend/fill with real data
        const trend = (classesWithCounts || []).map((cls) => ({
          name: cls.name,
          size: cls.studentCount || 0,
        }));
        setClassSizeTrend(trend);
        const fill = (classesWithCounts || []).map((cls) => ({
          name: cls.name,
          fill: cls.capacity
            ? Math.round((cls.studentCount / cls.capacity) * 100)
            : 0,
        }));
        setClassFillStatus(fill);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user, refresh]);

  const getClassStatus = (studentCount, capacity) => {
    const percentage = (studentCount / capacity) * 100;
    if (percentage >= 90)
      return { text: "Full", color: "bg-red-100 text-red-800" };
    if (percentage >= 75)
      return { text: "Almost Full", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Available", color: "bg-green-100 text-green-800" };
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <div className="mb-10">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-semibold transition-colors">
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
      <div className="mb-8">
        {/* Class Size Trend Area Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
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
              <XAxis dataKey="name" />
              <YAxis />
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
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Class Fill Status (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={classFillStatus}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
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
        {/* Weekly Class Schedule Bar Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Weekly Class Schedule (Demo)
          </h2>
          <p className="text-gray-500 mb-2">
            Shows the number of classes scheduled for each weekday.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={weeklyClassData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="classes" fill="#6366F1" name="Classes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Class Time Distribution Line Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Class Time Distribution (Demo)
          </h2>
          <p className="text-gray-500 mb-2">
            Shows how many classes are scheduled at each time slot during the
            day.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={classTimeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Classes"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Enrollment Modal */}
      {enrollmentModalClassId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <ManageEnrollmentForm
              user={user}
              classId={enrollmentModalClassId}
              onClose={() => setEnrollmentModalClassId(null)}
              onSuccess={() => {
                setEnrollmentModalClassId(null);
                setRefresh((r) => !r);
              }}
            />
          </div>
        </div>
      )}
      {showAddClassModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <ClassForm
              user={user}
              onClose={() => setShowAddClassModal(false)}
              onSuccess={() => {
                setShowAddClassModal(false);
                setRefresh((r) => !r);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;
