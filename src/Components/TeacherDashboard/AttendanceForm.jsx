import React, { useEffect, useState } from "react";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getAttendanceByClassAndDate,
  updateAttendance,
  createAttendance,
  logActivity,
} from "../../supabaseConfig/supabaseApi";
import { FaCheck, FaSave, FaTimes, FaClock } from "react-icons/fa";

const AttendanceForm = ({ user, onSuccess, onClose }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const teacherClasses = await getClassesByTeacher(user.id);
        setClasses(teacherClasses || []);
        if (teacherClasses && teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0].id || teacherClasses[0].class_id);
        } else {
          setSelectedClass("");
        }
      } catch (error) {
        setError("Error fetching classes");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;
      setLoading(true);
      try {
        const studentData = await getStudentsByClass(selectedClass);
        setStudents(studentData || []);
        // Initialize attendance state
        const initialAttendance = {};
        studentData?.forEach((item) => {
          initialAttendance[item.student.id] = "present";
        });
        setAttendance(initialAttendance);
      } catch (error) {
        setError("Error fetching students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setSaving(true);
    setError("");
    try {
      const existingAttendance = await getAttendanceByClassAndDate(
        selectedClass,
        selectedDate
      );
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
      } else {
        // Create new attendance records
        const attendanceRecords = Object.entries(attendance).map(
          ([studentId, status]) => ({
            student_id: studentId,
            class_id: selectedClass,
            date: selectedDate,
            status: status,
            teacher_id: user.id,
            created_at: new Date().toISOString(),
          })
        );
        await createAttendance(attendanceRecords);
        await logActivity(
          `Attendance marked for class ${selectedClass} on ${selectedDate}.`,
          "attendance",
          {
            user_id: user.id,
            user_role: user.role,
            user_name: `${user.first_name} ${user.last_name}`,
          }
        );
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      setError("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="w-full p-4">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                key={cls.id || cls.class_id}
                value={cls.id || cls.class_id}
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
            disabled={saving}
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
      {selectedClass && students.length > 0 && (
        <div className="bg-blue-100 p-6 rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Student Attendance
            </h2>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: '220px', overflowY: 'auto' }}>
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
                {students.slice(0, 3).map((student, index) => (
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
                            {student.student?.first_name} {student.student?.middle_name || ""} {student.student?.last_name}
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
                          onClick={() => handleAttendanceChange(student.student.id, "present")}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${attendance[student.student.id] === "present" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600 hover:bg-green-50"}`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.student.id, "absent")}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${attendance[student.student.id] === "absent" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600 hover:bg-red-50"}`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.student.id, "late")}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${attendance[student.student.id] === "late" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600 hover:bg-yellow-50"}`}
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
      {/* Always show a Cancel button at the bottom */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded-md"
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AttendanceForm;
