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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
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
      return;
    }
    // Find class details
    const cls = classes.find(
      (c) => c.class_id === selectedClass || c.id === selectedClass
    );
    setSelectedClassDetails(cls || null);
    // Fetch students
    getStudentsByClass(selectedClass).then((studentData) => {
      setStudents(studentData || []);
      // Initialize attendance state
      const initialAttendance = {};
      (studentData || []).forEach((item) => {
        initialAttendance[item.student.id] = "present";
      });
      setAttendance(initialAttendance);
    });
  }, [selectedClass, classes]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setSaving(true);
    try {
      const existingAttendance = await getAttendanceByClassAndDate(
        selectedClass,
        selectedDate
      );
      const subject_id = selectedClassDetails?.subject_id || "";
      if (existingAttendance && existingAttendance.length > 0) {
        // Update existing attendance
        const attendanceRecords = Object.entries(attendance).map(
          ([studentId, status]) => ({
            id: existingAttendance.find((a) => a.student_id === studentId)?.id,
            status: status,
          })
        );
        for (const record of attendanceRecords) {
          if (record.id) {
            await updateAttendance(record.id, { status: record.status });
          }
        }
        alert("Attendance updated successfully!");
      } else {
        // Create new attendance records
        const attendanceRecords = Object.entries(attendance).map(
          ([studentId, status]) => ({
            student_id: studentId,
            class_id: selectedClass,
            date: selectedDate,
            status: status,
            teacher_id: user.id,
            subject_id,
            note: "",
            created_at: new Date().toISOString(),
          })
        );
        console.log("Saving attendance records:", attendanceRecords);
        const error = await createAttendance(attendanceRecords);
        console.log("Attendance save error:", error);
        if (error) {
          alert("Failed to save attendance: " + error.message);
          setSaving(false);
          return;
        }
        alert("Attendance saved successfully!");
      }
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

  const stats = getAttendanceStats();

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
              <option value="">Select a class</option>
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
          <div className="flex items-end">
            <button
              onClick={handleSaveAttendance}
              disabled={saving || !selectedClass}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
            >
              {saving ? (
                <FaSave className="mr-2" />
              ) : (
                <FaCheck className="mr-2" />
              )}
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
        {/* Class details below controls */}
        {selectedClassDetails && (
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
        {/* Student list below class details */}
        {selectedClass && students.length === 0 && (
          <div className="bg-yellow-100 p-6 rounded-xl shadow text-center text-yellow-700 font-medium">
            No students found for the selected class.
          </div>
        )}
        {selectedClass && students.length > 0 && (
          <div className="bg-blue-100 p-6 rounded-xl shadow overflow-hidden my-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Student Attendance
              </h2>
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
      {/* Stats and charts below */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stats */}
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
      {/* Charts Section: Attendance Trend, Student Progress */}
      <div className="mb-8">
        {/* Attendance Trend Area Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Attendance Trend (Mountain Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={attendanceTrend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
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
        {/* Student Attendance Progress Ladder Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Student Attendance Progress (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={studentAttendanceProgress}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" />
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
    </div>
  );
};

export default TeacherAttendance;
