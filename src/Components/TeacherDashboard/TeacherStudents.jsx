import React, { useEffect, useState } from "react";
import {
  getAllStudents,
  deleteStudent,
  getStudentsByClass,
  getStudentsByTeacher,
  getAttendanceByStudent,
  getGradesByTeacher,
  getClassesByTeacher,
  getAssignmentsByTeacher,
  fetchAssignmentSubmissions,
  getTeacherStudentPerformanceStats,
} from "../../supabaseConfig/supabaseApi";
import { useUser } from "../../contexts/UserContext";
import Modal from "../Modal";
import Loader from "../Loader";

// Cache keys for localStorage
const CACHE_KEYS = {
  STUDENTS: 'teacher_students_cache',
  PERFORMANCE: 'teacher_performance_cache',
  CACHE_TIMESTAMP: 'teacher_data_timestamp'
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const TeacherStudents = () => {
  const { user } = useUser();
  const [students, setStudents] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [viewStudent, setViewStudent] = useState(null);
  const [performanceStats, setPerformanceStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    averageGrade: 0,
    highPerformers: 0,
    needsAttention: 0,
    recentActivity: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);

  // Check if cached data is still valid
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  };

  // Load data from cache
  const loadFromCache = () => {
    try {
      const cachedStudents = localStorage.getItem(CACHE_KEYS.STUDENTS);
      const cachedPerformance = localStorage.getItem(CACHE_KEYS.PERFORMANCE);
      
      if (cachedStudents && cachedPerformance) {
        const studentsData = JSON.parse(cachedStudents);
        const performanceData = JSON.parse(cachedPerformance);
        
        setStudents(studentsData);
        setPerformanceStats(performanceData);
        
        // Extract unique years for filter dropdown
        const uniqueYears = Array.from(
          new Set(studentsData.map((s) => s.year))
        ).filter(Boolean);
        setYears(uniqueYears.sort());
        
        return true;
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
    return false;
  };

  // Save data to cache
  const saveToCache = (studentsData, performanceData) => {
    try {
      localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(studentsData));
      localStorage.setItem(CACHE_KEYS.PERFORMANCE, JSON.stringify(performanceData));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Try to load from cache first
    if (isCacheValid() && loadFromCache()) {
      setLoading(false);
      return;
    }

    // If no valid cache, fetch fresh data
    fetchAllData();
  }, [user?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch both students and performance data in parallel
      const [studentsData, performanceData] = await Promise.all([
        getStudentsByTeacher(user?.id),
        getTeacherStudentPerformanceStats(user.id)
      ]);

      // Set students data
      setStudents(studentsData || []);
      const uniqueYears = Array.from(
        new Set((studentsData || []).map((s) => s.year))
      ).filter(Boolean);
      setYears(uniqueYears.sort());

      // Set performance data
      setPerformanceStats(performanceData || {
        totalStudents: 0,
        averageAttendance: 0,
        averageGrade: 0,
        highPerformers: 0,
        needsAttention: 0,
        recentActivity: 0,
      });

      // Save to cache
      saveToCache(studentsData || [], performanceData || {});

    } catch (error) {
      console.error("Error fetching data:", error);
      setStudents([]);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a function to force refresh data (for manual refresh if needed)
  const refreshData = async () => {
    // Clear cache
    localStorage.removeItem(CACHE_KEYS.STUDENTS);
    localStorage.removeItem(CACHE_KEYS.PERFORMANCE);
    localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
    
    // Fetch fresh data
    await fetchAllData();
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    const error = await deleteStudent(id);
    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Failed to delete student.");
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesName = `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesYear =
      yearFilter === "all" || String(s.year) === String(yearFilter);
    return matchesName && matchesYear;
  });

  // Only show up to visibleCount students
  const visibleStudents = filteredStudents.slice(0, visibleCount);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader message="Loading teacher dashboard..." />
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${studentsLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">Students Data</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${performanceLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">Performance Stats</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black min-h-screen min-w-0">
      {/* Performance Summary Cards */}
      <div className="mb-8 min-w-0">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Performance Summary
        </h2>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {performanceStats.totalStudents}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Attendance Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Attendance
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {performanceStats.averageAttendance}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Grade Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Grade
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {performanceStats.averageGrade}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* High Performers Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  High Performers
                </p>
                {/* <p className="text-3xl font-bold text-gray-900">
                  {performanceStats.highPerformers}
                </p> */}
                {performanceStats.highPerformerNames &&
                  performanceStats.highPerformerNames.length > 0 && (
                    <p className="text-xl font-bold text-green-600">
                      Top:{" "}
                      {
                        [...performanceStats.highPerformerNames].sort(
                          (a, b) => b.averageGrade - a.averageGrade
                        )[0].name
                      }{" "}
                      (
                      {
                        [...performanceStats.highPerformerNames].sort(
                          (a, b) => b.averageGrade - a.averageGrade
                        )[0].averageGrade
                      }
                      %)
                    </p>
                  )}
                <p className="text-xs text-gray-500">Grade ≥ 85%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Needs Attention Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Needs Attention
                </p>
                {/* <p className="text-3xl font-bold text-gray-900">
                  {performanceStats.needsAttention}
                </p> */}
                {performanceStats.needsAttentionNames &&
                  performanceStats.needsAttentionNames.length > 0 && (
                    <p className="text-xl font-bold text-red-600 font-medium">
                      Lowest:{" "}
                      {
                        [...performanceStats.needsAttentionNames].sort(
                          (a, b) => a.averageGrade - b.averageGrade
                        )[0].name
                      }{" "}
                      (
                      {
                        [...performanceStats.needsAttentionNames].sort(
                          (a, b) => a.averageGrade - b.averageGrade
                        )[0].averageGrade
                      }
                      %)
                    </p>
                  )}
                <p className="text-xs text-gray-500">Grade &lt; 60%</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Students Activity */}
        {recentStudents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Student Activity
            </h3>
            <div className="space-y-3">
              {recentStudents.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {student.first_name?.charAt(0)}
                        {student.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.activityType === "attendance"
                          ? "Attended class"
                          : "Submitted assignment"}{" "}
                        •{new Date(student.lastActivity).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(student.lastActivity).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Summary Section: Filters and Search */}
      <div className="mb-8 min-w-0">
        <h2 className="text-2xl font-semibold mb-6">Students</h2>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 min-w-0">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded w-full max-w-md"
          />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="border px-4 py-2 rounded w-full max-w-xs"
          >
            <option value="all">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table Section */}
      <div className="mb-6 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">
            Total Students: {filteredStudents.length}
          </span>
        </div>
        <div className="overflow-x-auto shadow rounded border mb-8 min-w-0">
          <table className="min-w-full border-collapse text-left text-sm md:text-base">
            <thead className="bg-[#1E6C7B] text-white">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No student found.
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-blue-50">
                    <td className="px-4 py-3">
                      {student.first_name} {student.middle_name ?? ""}{" "}
                      {student.last_name}
                    </td>
                    <td className="px-4 py-3">{student.email}</td>
                    <td className="px-4 py-3">{student.gender}</td>
                    <td className="px-4 py-3">{student.year}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => setViewStudent(student)}
                      >
                        View
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleDelete(student.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Show More / Show Less Buttons */}
          <div className="flex justify-center gap-4 my-4">
            {visibleCount < filteredStudents.length && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setVisibleCount((prev) => prev + 5)}
              >
                Show More
              </button>
            )}
            {visibleCount > 5 && (
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setVisibleCount((prev) => Math.max(5, prev - 5))}
              >
                Show Less
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View Student Modal */}
      {viewStudent && (
        <Modal title="Student Details" onClose={() => setViewStudent(null)}>
          <h2 className="text-2xl font-bold mb-4">Student Details</h2>
          <div className="space-y-2">
            <div>
              <strong>Name:</strong> {viewStudent.first_name}{" "}
              {viewStudent.middle_name ?? ""} {viewStudent.last_name}
            </div>
            <div>
              <strong>Email:</strong> {viewStudent.email}
            </div>
            <div>
              <strong>Gender:</strong> {viewStudent.gender}
            </div>
            <div>
              <strong>Year:</strong> {viewStudent.year}
            </div>
            <div>
              <strong>Phone:</strong> {viewStudent.phone}
            </div>
            <div>
              <strong>Date of Birth:</strong> {viewStudent.dob}
            </div>
            <div>
              <strong>Address:</strong> {viewStudent.address}
            </div>
            {/* Add more fields as needed */}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherStudents;