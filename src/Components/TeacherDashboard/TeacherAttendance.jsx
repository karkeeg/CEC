import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  FaCalendarAlt,
  FaUsers,
  FaCheck,
  FaTimes,
  FaSave,
  FaClock,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getAttendanceByClassAndDate,
  updateAttendance,
  createAttendance,
} from "../../supabaseConfig/supabaseApi";
import { getSubjects } from "../../supabaseConfig/supabaseApi";

const TeacherAttendance = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceTrend, setAttendanceTrend] = useState([]); // For AreaChart
  const [studentAttendanceProgress, setStudentAttendanceProgress] = useState(
    []
  ); // For StepLine
  const [subjects, setSubjects] = useState([]);
  const [attendanceExists, setAttendanceExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // New: State for all attendance records for all classes (for overall stats)
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    getClassesByTeacher(user.id).then((data) => {
      setClasses(data || []);
      setLoading(false);
    });
    getSubjects().then(setSubjects);
  }, [user]);

  useEffect(() => {
    if (!selectedClass) {
      setSelectedClassDetails(null);
      setStudents([]);
      setAttendance({});
      setAttendanceExists(false);
      setIsEditing(false);
      return;
    }
    // Find class details
    const cls = classes.find(
      (c) => c.class_id === selectedClass || c.id === selectedClass
    );
    setSelectedClassDetails(cls || null);
    // If class has a schedule date, set the date picker to it
    if (cls && cls.schedule) {
      // Try to extract date part if schedule is ISO string
      const datePart = cls.schedule.split("T")[0];
      setSelectedDate(datePart);
    }
    // Fetch students
    getStudentsByClass(selectedClass).then((studentData) => {
      setStudents(studentData || []);
      // Attendance will be set in the next effect
    });
  }, [selectedClass, classes]);

  // On class or date change, fetch attendance records
  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setAttendance({});
      setAttendanceExists(false);
      setIsEditing(false);
      return;
    }
    getAttendanceByClassAndDate(selectedClass, selectedDate).then((records) => {
      if (records && records.length > 0) {
        // Attendance exists, set state to actual status
        const att = {};
        records.forEach((rec) => {
          att[rec.student_id] = rec.status;
        });
        setAttendance(att);
        setAttendanceExists(true);
        setIsEditing(false);
      } else {
        // No attendance yet, set all to 'absent'
        const att = {};
        students.forEach((item) => {
          att[item.student.id] = "absent";
        });
        setAttendance(att);
        setAttendanceExists(false);
        setIsEditing(false);
      }
    });
  }, [selectedClass, selectedDate, students]);

  // Fetch all attendance records for all classes for the teacher (for overall stats)
  useEffect(() => {
    if (!user?.id) return;
    if (selectedClass === "") {
      // Use fetchAttendance from supabaseApi
      import("../../supabaseConfig/supabaseApi").then((api) => {
        api.fetchAttendance({ teacher_id: user.id }).then((records) => {
          setAllAttendanceRecords(records || []);
        });
      });
    }
  }, [user, selectedClass]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveOrUpdateAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setSaving(true);
    try {
      const existingAttendance = await getAttendanceByClassAndDate(
        selectedClass,
        selectedDate
      );
      const subject_id = selectedClassDetails?.subject_id || "";
      // Map of student_id to attendance record id
      const existingMap = {};
      (existingAttendance || []).forEach((a) => {
        existingMap[a.student_id] = a.id;
      });
      // Split attendance into updates and creates
      const toUpdate = [];
      const toCreate = [];
      Object.entries(attendance).forEach(([studentId, status]) => {
        if (existingMap[studentId]) {
          toUpdate.push({ id: existingMap[studentId], status });
        } else {
          toCreate.push({
            student_id: studentId,
            class_id: selectedClass,
            date: selectedDate,
            status,
            teacher_id: user.id,
            subject_id,
            note: "",
            created_at: new Date().toISOString(),
          });
        }
      });
      // Update existing records
      for (const record of toUpdate) {
        await updateAttendance(record.id, { status: record.status });
      }
      // Create new records for new students
      if (toCreate.length > 0) {
        const error = await createAttendance(toCreate);
        if (error) {
          alert("Failed to save attendance for new students: " + error.message);
          setSaving(false);
          return;
        }
      }
      alert("Attendance saved/updated successfully!");
      setAttendanceExists(true);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(
      (status) => status === "present"
    ).length;
    const absent = Object.values(attendance).filter(
      (status) => status === "absent"
    ).length;
    const late = Object.values(attendance).filter(
      (status) => status === "late"
    ).length;

    return { total, present, absent, late };
  };

  // Helper to get stats for all classes
  const getOverallAttendanceStats = () => {
    const total = allAttendanceRecords.length;
    const present = allAttendanceRecords.filter(
      (a) => a.status === "present"
    ).length;
    const absent = allAttendanceRecords.filter(
      (a) => a.status === "absent"
    ).length;
    const late = allAttendanceRecords.filter((a) => a.status === "late").length;
    return { total, present, absent, late };
  };

  // Helper to get chart data for all classes
  const getOverallAttendanceTrend = () => {
    // Group by date
    const trendMap = {};
    allAttendanceRecords.forEach((rec) => {
      const date = rec.date?.slice(0, 10);
      if (!trendMap[date])
        trendMap[date] = { name: date, present: 0, absent: 0, late: 0 };
      if (rec.status === "present") trendMap[date].present++;
      if (rec.status === "absent") trendMap[date].absent++;
      if (rec.status === "late") trendMap[date].late++;
    });
    return Object.values(trendMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Helper to get student progress for all classes
  const getOverallStudentProgress = () => {
    // Group by student
    const progressMap = {};
    allAttendanceRecords.forEach((rec) => {
      if (!progressMap[rec.student_id])
        progressMap[rec.student_id] = { name: rec.student_id, progress: 0 };
      if (rec.status === "present") progressMap[rec.student_id].progress++;
    });
    return Object.values(progressMap);
  };

  // Use overall or class-specific stats/charts
  const stats =
    selectedClass && selectedClass !== ""
      ? getAttendanceStats()
      : getOverallAttendanceStats();
  const attendanceTrendData =
    selectedClass && selectedClass !== ""
      ? attendanceTrend
      : getOverallAttendanceTrend();
  const studentAttendanceProgressData =
    selectedClass && selectedClass !== ""
      ? studentAttendanceProgress
      : getOverallStudentProgress();

  // Pie chart colors
  const ATTENDANCE_COLORS = ["#10B981", "#EF4444", "#F59E0B"];

  // Pie chart data for status distribution
  const pieData = [
    { name: "Present", value: stats.present },
    { name: "Absent", value: stats.absent },
    { name: "Late", value: stats.late },
  ];
  // Bar chart data: attendance per date (for all or selected class)
  const barData = (
    selectedClass && selectedClass !== ""
      ? attendanceTrend
      : getOverallAttendanceTrend()
  ).map((d) => ({
    name: d.name,
    Present: d.present,
    Absent: d.absent,
    Late: d.late,
  }));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Only keep the boxed attendance form at the top */}
      <div className="bg-white border border-blue-200 rounded-2xl shadow-lg p-6 mb-10">
        <h2 className="text-2xl font-bold mb-4">Take Attendance</h2>
        {/* Controls: class selection, date, save button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option
                  key={cls.class_id || cls.id}
                  value={cls.class_id || cls.id}
                >
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end">
            {/* Button logic: Save, Update, Save Update */}
            {!attendanceExists && (
              <button
                onClick={handleSaveOrUpdateAttendance}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            )}
            {attendanceExists && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                disabled={saving}
              >
                Update Attendance
              </button>
            )}
            {attendanceExists && isEditing && (
              <button
                onClick={handleSaveOrUpdateAttendance}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Update"}
              </button>
            )}
          </div>
        </div>
        {/* Only show attendance form/student list if a specific class is selected */}
        {selectedClass && selectedClass !== "" && selectedClassDetails && (
          <div className="bg-blue-50 p-4 rounded-xl shadow mb-4">
            <h3 className="text-lg font-semibold mb-2">Class Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <strong>Name:</strong> {selectedClassDetails.name}
              </div>
              <div>
                <strong>Year:</strong> {selectedClassDetails.year}
              </div>
              <div>
                <strong>Semester:</strong> {selectedClassDetails.semester}
              </div>
              <div>
                <strong>Room:</strong> {selectedClassDetails.room_no}
              </div>
              <div>
                <strong>Capacity:</strong> {selectedClassDetails.capacity}
              </div>
              <div>
                <strong>Subject:</strong>{" "}
                {subjects.find((s) => s.id === selectedClassDetails.subject_id)
                  ?.name || selectedClassDetails.subject_id}
              </div>
              <div>
                <strong>Schedule:</strong> {selectedClassDetails.schedule}
              </div>
              <div>
                <strong>Description:</strong> {selectedClassDetails.description}
              </div>
              <div>
                <strong>Total Students:</strong> {students.length}
              </div>
            </div>
          </div>
        )}
        {selectedClass && selectedClass !== "" && students.length === 0 && (
          <div className="bg-yellow-100 p-6 rounded-xl shadow text-center text-yellow-700 font-medium">
            No students found for the selected class.
          </div>
        )}
        {selectedClass && selectedClass !== "" && students.length > 0 && (
          <div className="bg-blue-100 p-6 rounded-xl shadow overflow-hidden my-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Student Attendance
              </h2>
              {!attendanceExists && (
                <div className="text-red-500 text-sm mt-2">
                  Attendance has not been taken for this class and date. Please
                  save attendance to enable editing.
                </div>
              )}
              {attendanceExists && !isEditing && (
                <div className="text-green-600 text-sm mt-2">
                  Attendance was already taken. Click on{" "}
                  <b>Update Attendance</b> to enable editing.
                </div>
              )}
              {attendanceExists && isEditing && (
                <div className="text-blue-600 text-sm mt-2">
                  You are now editing attendance. Make changes and click{" "}
                  <b>Save Update</b>.
                </div>
              )}
            </div>
            <div className="w-full max-h-64 overflow-y-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {student.student?.first_name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.student?.first_name}{" "}
                              {student.student?.middle_name || ""}{" "}
                              {student.student?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {student.student?.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleAttendanceChange(
                                student.student.id,
                                "present"
                              )
                            }
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              attendance[student.student.id] === "present"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600 hover:bg-green-50"
                            }`}
                            disabled={attendanceExists && !isEditing}
                          >
                            Present
                          </button>
                          <button
                            onClick={() =>
                              handleAttendanceChange(
                                student.student.id,
                                "absent"
                              )
                            }
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              attendance[student.student.id] === "absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-600 hover:bg-red-50"
                            }`}
                            disabled={attendanceExists && !isEditing}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() =>
                              handleAttendanceChange(student.student.id, "late")
                            }
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              attendance[student.student.id] === "late"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-600 hover:bg-yellow-50"
                            }`}
                            disabled={attendanceExists && !isEditing}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Stats and charts below: always render, aggregate if no class selected */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stats: calculate for selected class or all classes */}
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <FaUsers className="text-white text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Present</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.present}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <FaCheck className="text-white text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Absent</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.absent}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-full">
              <FaTimes className="text-white text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Late</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.late}
              </p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-full">
              <FaClock className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>
      {/* Charts Section: Attendance Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pie Chart: Attendance Status Distribution */}
        <div className="bg-blue-100 p-6 rounded-xl shadow flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Attendance Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={ATTENDANCE_COLORS[idx % ATTENDANCE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Bar Chart: Attendance per Date */}
        <div className="bg-blue-100 p-6 rounded-xl shadow flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Attendance by Date
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#10B981" />
              <Bar dataKey="Absent" fill="#EF4444" />
              <Bar dataKey="Late" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
