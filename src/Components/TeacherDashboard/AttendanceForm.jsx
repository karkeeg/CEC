import React, { useEffect, useState } from "react";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getAttendanceByClassAndDate,
  updateAttendance,
  createAttendance,
  logActivity,
} from "../../supabaseConfig/supabaseApi";
import {
  FaCheck,
  FaSave,
  FaTimes,
  FaClock,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const AttendanceForm = ({ user, onSuccess, onClose }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  // Format date to match database format (YYYY-MM-DD)
  const formatDateForDB = (date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(formatDateForDB(new Date()));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const teacherClasses = await getClassesByTeacher(user.id);
        setClasses(teacherClasses || []);
        if (teacherClasses && teacherClasses.length > 0) {
          // Only set the first class if not already selected
          if (!selectedClass) {
            setSelectedClass(
              teacherClasses[0].id || teacherClasses[0].class_id
            );
          }
        } else {
          setSelectedClass("");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError("Error fetching classes");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user, selectedClass]);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClass || !selectedDate) return;
      setLoading(true);
      try {
        console.log(
          "Fetching data for class:",
          selectedClass,
          "date:",
          selectedDate
        );

        // Format the date for the API call
        const formattedDate = formatDateForDB(selectedDate);
        console.log("Fetching data:", {
          classId: selectedClass,
          date: selectedDate,
          formattedDate: formattedDate,
          currentTime: new Date().toISOString(),
        });

        // Fetch students and attendance data in parallel
        const [studentData, existingAttendance] = await Promise.all([
          getStudentsByClass(selectedClass),
          getAttendanceByClassAndDate(selectedClass, formattedDate),
        ]);

        console.log(
          "Raw student data from API:",
          JSON.stringify(studentData, null, 2)
        );
        console.log(
          "Raw attendance data from API:",
          JSON.stringify(existingAttendance, null, 2)
        );

        // Debug: Log the raw attendance data we received
        console.log("Raw attendance response:", {
          recordCount: Array.isArray(existingAttendance)
            ? existingAttendance.length
            : "not an array",
          firstRecord: existingAttendance?.[0],
          allRecords: existingAttendance,
        });

        // If no records found, try to fetch all records for this class to debug
        if (
          !Array.isArray(existingAttendance) ||
          existingAttendance.length === 0
        ) {
          console.log(
            "No attendance records found for the specified date. Checking all records for this class..."
          );
          try {
            const allClassRecords = await supabase
              .from("attendance")
              .select("*")
              .eq("class_id", selectedClass)
              .order("date", { ascending: false });

            console.log("All attendance records for class:", {
              count: allClassRecords.data?.length || 0,
              dates: allClassRecords.data
                ?.map((r) => r.date)
                .filter((v, i, a) => a.indexOf(v) === i),
              sample: allClassRecords.data?.[0],
            });
          } catch (error) {
            console.error("Error fetching all attendance records:", error);
          }
        }

        // Ensure we have valid student data
        if (!Array.isArray(studentData)) {
          console.error("Invalid student data received:", studentData);
          setError("Failed to load student data");
          setStudents([]);
          setAttendance({});
          return;
        }

        setStudents(studentData);

        // Create a map of student_id to status from existing attendance
        const attendanceMap = new Map();

        if (
          Array.isArray(existingAttendance) &&
          existingAttendance.length > 0
        ) {
          console.log("Processing attendance records:");
          existingAttendance.forEach((record, index) => {
            console.log(`Processing record ${index + 1}:`, {
              student_id: record.student_id,
              status: record.status,
              class_id: record.class_id,
              date: record.date,
            });

            if (record?.student_id) {
              const studentId = record.student_id.toString();
              // Make sure status is valid, default to 'absent' if not
              const status = ["present", "absent", "late"].includes(
                record.status?.toLowerCase()
              )
                ? record.status.toLowerCase()
                : "absent";

              console.log(
                `  Mapping - Student ID: ${studentId}, Status: ${status}`
              );
              attendanceMap.set(studentId, status);
            } else {
              console.warn("  Skipping record - missing student_id:", record);
            }
          });

          // Debug: Log the final map
          console.log(
            "Attendance map after processing:",
            Object.fromEntries(attendanceMap)
          );
        } else {
          console.log(
            "No attendance records found for this date or invalid format"
          );
        }

        // Initialize attendance state with existing data or default to 'absent'
        const initialAttendance = {};
        console.log("\nProcessing students:");

        console.log("\nProcessing students and mapping attendance:");
        studentData.forEach((item, index) => {
          // Try multiple possible ID locations in the student object
          const studentId = (
            item?.student?.id ||
            item?.id ||
            item?.student_id
          )?.toString();

          if (!studentId) {
            console.warn(
              `Student ${index + 1}: Could not determine ID for student:`,
              item
            );
            return;
          }

          // Get status from map or default to 'absent'
          const statusFromMap = attendanceMap.get(studentId);
          initialAttendance[studentId] = statusFromMap;

          // Debug log for each student
          console.log(`Student ${index + 1}:`, {
            studentId,
            name: item.name || item.student?.name || "Unknown",
            statusFromMap,
            finalStatus: initialAttendance[studentId],
            hasMatch: statusFromMap !== undefined,
          });
        });

        console.log(
          "\nFinal attendance mapping:",
          JSON.stringify(initialAttendance, null, 2)
        );
        setAttendance(initialAttendance);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error loading attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate]); // Added selectedDate as a dependency

  const handleAttendanceChange = (studentId, status) => {
    // Ensure studentId is a string for consistent handling
    const idString = studentId.toString();
    console.log(
      `Updating attendance - Student ID: ${idString}, Status: ${status}`
    );

    setAttendance((prev) => ({
      ...prev,
      [idString]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const existingAttendance = await getAttendanceByClassAndDate(
        selectedClass,
        selectedDate
      );

      // Prepare attendance records to save
      const attendanceRecords = Object.entries(attendance).map(
        ([studentId, status]) => ({
          student_id: studentId,
          class_id: selectedClass,
          date: selectedDate,
          status,
          teacher_id: user.id,
          created_at: new Date().toISOString(),
        })
      );

      // Update or create attendance records
      const updatePromises = attendanceRecords.map((record) => {
        const existingRecord = existingAttendance?.find(
          (a) => a.student_id === record.student_id
        );
        if (existingRecord) {
          return updateAttendance(existingRecord.id, { status: record.status });
        } else {
          return createAttendance(record);
        }
      });

      await Promise.all(updatePromises);

      // Log activity
      await logActivity({
        user_id: user.id,
        action: "attendance_updated",
        details: `Updated attendance for class ${selectedClass} on ${selectedDate}`,
        ip_address: "127.0.0.1",
      });

      setSuccess("Attendance saved successfully!");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setError("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Get attendance statistics
  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(
      (status) => status == "present"
    ).length;
    const absent = Object.values(attendance).filter(
      (status) => status == "absent"
    ).length;
    const late = Object.values(attendance).filter(
      (status) => status == "late"
    ).length;

    return { total, present, absent, late };
  };

  const stats = getAttendanceStats();

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="w-[600px] mx-auto">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {/* Inputs row */}
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
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

      {/* Table */}
      {selectedClass && students.length > 0 && (
        <div className="w-full">
          <div className="bg-white p-3 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
                Student Attendance
              </h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-green-600 font-medium">
                  {stats.present} Present
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-red-600 font-medium">
                  {stats.absent} Absent
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-yellow-600 font-medium">
                  {stats.late} Late
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 font-medium">
                  {stats.total} Total
                </span>
              </div>
            </div>

            <div className="w-full border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Student Information
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => {
                      const studentId = student.student?.id;
                      if (!studentId)
                        return <div key={index}>No student Found</div>;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {student.student?.first_name}{" "}
                                {student.student?.middle_name || ""}{" "}
                                {student.student?.last_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  handleAttendanceChange(studentId, "present")
                                }
                                className={`px-4 py-1 text-sm rounded-md font-medium ${
                                  attendance[studentId] === "present"
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() =>
                                  handleAttendanceChange(studentId, "absent")
                                }
                                className={`px-4 py-1 text-sm rounded-md font-medium ${
                                  attendance[studentId] === "absent"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() =>
                                  handleAttendanceChange(studentId, "late")
                                }
                                className={`px-4 py-1 text-sm rounded-md font-medium ${
                                  attendance[studentId] === "late"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <div className="mt-4">
        <button
          onClick={onClose}
          className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AttendanceForm;
