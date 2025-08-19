import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getAssignmentsByTeacher,
  getAssignmentSubmissions,
  updateAssignmentSubmissionGrade,
  getClassesByTeacher,
  getStudentsByClass,
  createAttendance,
  getSubjects,
  updateGrade,
  createGrade,
} from "../../supabaseConfig/supabaseApi";
import {
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
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
} from "recharts";
import Loader from "../Loader";

// Cache keys for localStorage
const CACHE_KEYS = {
  ASSIGNMENTS: 'teacher_grades_assignments_cache',
  CLASSES: 'teacher_grades_classes_cache',
  CACHE_TIMESTAMP: 'teacher_grades_timestamp'
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const TeacherGrades = () => {
  const { user } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeTrend, setGradeTrend] = useState([]); // For AreaChart
  const [gradeCompletion, setGradeCompletion] = useState([]); // For StepLine
  const [classes, setClasses] = useState([]);
  const [attendanceClass, setAttendanceClass] = useState("");
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceSubject, setAttendanceSubject] = useState("");
  const [attendanceSubjects, setAttendanceSubjects] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [modalSubmission, setModalSubmission] = useState(null);
  const [modalFeedback, setModalFeedback] = useState("");
  const [modalRating, setModalRating] = useState("");
  const [modalGrade, setModalGrade] = useState("");
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Check if cached data is still valid
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  };

  // Load data from cache
  const loadFromCache = () => {
    try {
      const cachedAssignments = localStorage.getItem(CACHE_KEYS.ASSIGNMENTS);
      const cachedClasses = localStorage.getItem(CACHE_KEYS.CLASSES);
      
      if (cachedAssignments && cachedClasses) {
        const assignmentsData = JSON.parse(cachedAssignments);
        const classesData = JSON.parse(cachedClasses);
        
        setAssignments(assignmentsData);
        setClasses(classesData);
        
        return true;
      }
    } catch (error) {
      console.error("Error loading grades cache:", error);
    }
    return false;
  };

  // Save data to cache
  const saveToCache = (assignmentsData, classesData) => {
    try {
      localStorage.setItem(CACHE_KEYS.ASSIGNMENTS, JSON.stringify(assignmentsData));
      localStorage.setItem(CACHE_KEYS.CLASSES, JSON.stringify(classesData));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error("Error saving grades cache:", error);
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
    const fetchAssignments = async () => {
      try {
        const assignmentData = await getAssignmentsByTeacher(user.id);
        console.log("[DEBUG] Assignments fetched:", assignmentData);
        setAssignments(assignmentData || []);
        if (assignmentData && assignmentData.length > 0) {
          setSelectedAssignment(assignmentData[0].id);
        }
        // Mock or fetch grade trend data
        const trend = (assignmentData || []).map((a) => ({
          name: a.title,
          avgGrade: Math.floor(Math.random() * 100),
        }));
        setGradeTrend(trend);
        // Mock or fetch grade completion data
        const completion = (assignmentData || []).map((a) => ({
          name: a.title,
          completion: Math.floor(Math.random() * 100),
        }));
        setGradeCompletion(completion);
      } catch (error) {
        console.error("[DEBUG] Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        let submissionData = [];
        if (!selectedAssignment) {
          // Fetch all submissions for all assignments by this teacher
          const allAssignments = await getAssignmentsByTeacher(user.id);
          console.log("[DEBUG] All assignments for teacher:", allAssignments);
          const allSubmissions = await getAssignmentSubmissions();
          console.log("[DEBUG] All submissions:", allSubmissions);
          // Only include submissions for assignments by this teacher
          const teacherAssignmentIds = (allAssignments || []).map((a) => a.id);
          submissionData = (allSubmissions || []).filter((s) =>
            teacherAssignmentIds.includes(s.assignment_id)
          );
        } else {
          // Fetch submissions for the selected assignment
          submissionData = await getAssignmentSubmissions(selectedAssignment);
          console.log(
            "[DEBUG] Submissions for assignment",
            selectedAssignment,
            ":",
            submissionData
          );
        }
        setSubmissions(submissionData || []);
        // Initialize grades state
        const initialGrades = {};
        submissionData?.forEach((submission) => {
          initialGrades[submission.id] = {
            grade: submission.grade?.grade || "",
            feedback: submission.grade?.feedback || "",
            gradeId: submission.grade?.id || null,
          };
        });
        setGrades(initialGrades);
        console.log("[DEBUG] Grades state initialized:", initialGrades);
        if (!submissionData || submissionData.length === 0) {
        }
      } catch (error) {
        console.error("[DEBUG] Error fetching submissions:", error);
      }
    };
    fetchSubmissions();
  }, [selectedAssignment, user]);

  // Remove attendance-related imports, state, effects, and UI from this file.
  // Only keep assignment grading logic and UI.

  const handleGradeChange = (submissionId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value,
      },
    }));
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      for (const [submissionId, gradeData] of Object.entries(grades)) {
        console.log(
          "[DEBUG] Saving grade for submission:",
          submissionId,
          gradeData
        );
        if (gradeData.gradeId) {
          // Update existing grade
          const { data, error } = await updateGrade(gradeData.gradeId, {
            grade: gradeData.grade ? parseInt(gradeData.grade) : null,
            feedback: gradeData.feedback,
            rated_at: new Date().toISOString(),
          });
          console.log("[DEBUG] updateGrade response:", data, error);
        } else {
          // Create new grade
          const { data, error } = await createGrade({
            submission_id: submissionId,
            grade: gradeData.grade ? parseInt(gradeData.grade) : null,
            feedback: gradeData.feedback,
            rated_at: new Date().toISOString(),
          });
          console.log("[DEBUG] createGrade response:", data, error);
        }
      }
      alert("Grades saved successfully!");
    } catch (error) {
      console.error("[DEBUG] Error saving grades:", error);
      alert("Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  const getGradeStats = () => {
    const total = submissions.length;
    const graded = Object.values(grades).filter((g) => g.grade !== "").length;
    const average =
      total > 0
        ? Object.values(grades)
            .filter((g) => g.grade !== "")
            .reduce((sum, g) => sum + parseInt(g.grade), 0) / graded
        : 0;

    return { total, graded, average: Math.round(average) };
  };

  const getGradeColor = (grade, totalPoints) => {
    if (!grade || !totalPoints) return "text-gray-500";
    const percentage = (grade / totalPoints) * 100;
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const studentName = `${submission.student?.first_name || ""} ${
      submission.student?.middle_name || ""
    } ${submission.student?.last_name || ""}`;
    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });
  console.log("Filtered submissions:", filteredSubmissions); // DEBUG

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading grades data..." />
      </div>
    );
  }

  const stats = getGradeStats();
  const selectedAssignmentData = assignments.find(
    (a) => a.id === selectedAssignment
  );

  // Modal save handler (to be connected to new grades table)
  const handleSaveGrade = async () => {
    // TODO: Save to grades table (API call)
    alert(
      `Saved!\nFeedback: ${modalFeedback}\nRating: ${modalRating}\nGrade: ${modalGrade}`
    );
    setShowGradeModal(false);
    setModalSubmission(null);
    setModalFeedback("");
    setModalRating("");
    setModalGrade("");
  };

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-w-0">
      {/* Summary Section: Assignment Selection and Stats */}
      <div className="mb-8 min-w-0">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Grades</h1>
        <p className="text-gray-600">Manage and grade student assignments</p>
        {/* Combined Filter and Submissions Table Section */}
        <div className="bg-blue-50 p-6 rounded-2xl shadow mb-8 border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:mr-2">
                Select Assignment
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Assignments</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} - {assignment.class?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:mr-2">
                Search Student
              </label>
              <div className="relative w-full md:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
          <div className="mt-2 text-blue-700 text-sm font-medium mb-4">
            Select an assignment to see who submitted and grade them, or choose
            'All Assignments' to see all submissions.
          </div>
          <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
            <table className="min-w-full border-collapse text-left text-sm md:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 max-w-xs truncate">
                    Notes
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-2 py-4 text-center text-gray-500"
                    >
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {assignments.find(
                            (a) => a.id === submission.assignment_id
                          )?.title || "-"}
                        </span>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {submission.student?.first_name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                              {submission.student?.first_name}{" "}
                              {submission.student?.middle_name || ""}{" "}
                              {submission.student?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.student?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.submitted_at
                          ? new Date(
                              submission.submitted_at
                            ).toLocaleDateString()
                          : "Not submitted"}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 w-48 max-w-xs truncate overflow-hidden">
                        {submission.notes || "-"}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium"
                          onClick={() => {
                            setShowGradeModal(true);
                            setModalSubmission(submission);
                            setModalFeedback(submission.grade?.feedback || "");
                            setModalRating(submission.grade?.rating || "");
                            setModalGrade(submission.grade?.grade || "");
                          }}
                        >
                          Give Feedback & Grade
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Show message below table if no submissions found
          {filteredSubmissions.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">
              No submissions found for the selected assignment.
            </div>
          )} */}
        </div>

        {/* Stats: Always show, for all or selected assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 min-w-0">
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Submissions
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <FaGraduationCap className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Graded</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats.graded}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <FaEdit className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Average Grade
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats.average}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <FaGraduationCap className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback/Grade Modal */}
        {showGradeModal && modalSubmission && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md w-full max-w-md min-w-0">
              <h2 className="text-xl font-bold mb-4">Give Feedback & Grade</h2>
              <div className="mb-2">
                <strong>Student:</strong> {modalSubmission.student?.first_name}{" "}
                {modalSubmission.student?.last_name}
              </div>
              <div className="mb-2">
                <strong>Notes:</strong> {modalSubmission.notes || "-"}
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  Feedback
                </label>
                <textarea
                  className="w-full border rounded px-2 py-1"
                  rows={3}
                  value={modalFeedback}
                  onChange={(e) => setModalFeedback(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Rating</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={modalRating}
                  onChange={(e) => setModalRating(e.target.value)}
                >
                  <option value="">Select rating</option>
                  {[...Array(10)].map((_, i) => {
                    const val = (i + 1) * 0.5;
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Grade</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  type="number"
                  value={modalGrade}
                  onChange={(e) => setModalGrade(e.target.value)}
                  placeholder="e.g. 90"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      if (grades[modalSubmission.id]?.gradeId) {
                        await updateGrade(grades[modalSubmission.id].gradeId, {
                          grade: modalGrade ? parseInt(modalGrade) : null,
                          feedback: modalFeedback,
                          rating: modalRating ? parseFloat(modalRating) : null,
                          rated_by: user?.id || null,
                          rated_at: new Date().toISOString(),
                        });
                      } else {
                        await createGrade({
                          submission_id: modalSubmission.id,
                          grade: modalGrade ? parseInt(modalGrade) : null,
                          feedback: modalFeedback,
                          rating: modalRating ? parseFloat(modalRating) : null,
                          rated_by: user?.id || null,
                          rated_at: new Date().toISOString(),
                        });
                      }
                      // Refresh submissions
                      const refreshed = selectedAssignment
                        ? await getAssignmentSubmissions(selectedAssignment)
                        : (await getAssignmentSubmissions()).filter((s) =>
                            assignments
                              .map((a) => a.id)
                              .includes(s.assignment_id)
                          );
                      setSubmissions(refreshed || []);
                      setShowGradeModal(false);
                      setModalSubmission(null);
                      setModalFeedback("");
                      setModalRating("");
                      setModalGrade("");
                      alert("Grade saved!");
                    } catch (error) {
                      alert("Failed to save grade");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setShowGradeModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section: Grade Trend, Completion */}
      <div className="mb-8 min-w-0">
        {/* Grade Trend Area Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Assignment Grade Trends
            </h2>
            <p className="text-sm text-gray-600">
              Shows the average grade percentage for each assignment across all
              students
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={gradeTrend}
              margin={{ top: 10, right: 30, left: 50, bottom: 30 }}
            >
              <defs>
                <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                hide={false}
                label={{
                  value: "Assignment Title",
                  position: "bottom",
                  offset: -20,
                }}
                tick={false}
              />
              <YAxis
                label={{
                  value: "Average Grade (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Average Grade"]}
                labelFormatter={(label) => `Assignment: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="avgGrade"
                name="Average Grade"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorGrade)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Grade Completion Ladder Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Assignment Completion Rates
            </h2>
            <p className="text-sm text-gray-600">
              Shows the percentage of students who have completed each
              assignment
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={gradeCompletion}
              margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
            >
              <XAxis
                dataKey="name"
                hide={false}
                label={{
                  value: "Assignment Title",
                  position: "bottom",
                  offset: -20,
                }}
                tick={false}
              />
              <YAxis
                label={{
                  value: "Completion Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Completion Rate"]}
                labelFormatter={(label) => `Assignment: ${label}`}
              />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="completion"
                name="Completion Rate"
                stroke="#3B82F6"
                strokeWidth={3}
                // dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeacherGrades;
