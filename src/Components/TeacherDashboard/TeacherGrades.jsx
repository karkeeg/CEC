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

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      try {
        const assignmentData = await getAssignmentsByTeacher(user.id);
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
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedAssignment) return;
      try {
        const submissionData = await getAssignmentSubmissions(
          selectedAssignment
        );
        setSubmissions(submissionData || []);
        // Initialize grades state
        const initialGrades = {};
        submissionData?.forEach((submission) => {
          initialGrades[submission.id] = {
            grade: submission.grade || "",
            feedback: submission.feedback || "",
          };
        });
        setGrades(initialGrades);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };
    fetchSubmissions();
  }, [selectedAssignment]);

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
      const updates = Object.entries(grades).map(
        ([submissionId, gradeData]) => ({
          id: submissionId,
          grade: gradeData.grade ? parseInt(gradeData.grade) : null,
          feedback: gradeData.feedback,
        })
      );
      for (const update of updates) {
        await updateAssignmentSubmissionGrade(update.id, {
          grade: update.grade,
          feedback: update.feedback,
        });
      }
      alert("Grades saved successfully!");
    } catch (error) {
      console.error("Error saving grades:", error);
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
    const studentName = `${submission.student?.first_name} ${
      submission.student?.middle_name || ""
    } ${submission.student?.last_name}`;
    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

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

  const stats = getGradeStats();
  const selectedAssignmentData = assignments.find(
    (a) => a.id === selectedAssignment
  );

  return (
    <div className="w-full p-4">
      {/* Summary Section: Assignment Selection and Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Grades</h1>
        <p className="text-gray-600">Manage and grade student assignments</p>
        {/* Assignment Selection */}
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assignment
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an assignment</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} - {assignment.class?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSaveGrades}
                disabled={saving || !selectedAssignment}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
              >
                <FaSave />
                <span>{saving ? "Saving..." : "Save All Grades"}</span>
              </button>
            </div>
          </div>
        </div>
        {/* Stats */}
        {selectedAssignment && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
        )}
      </div>
      {/* Charts Section: Grade Trend, Completion */}
      <div className="mb-8">
        {/* Grade Trend Area Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Grade Trend (Mountain Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={gradeTrend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="avgGrade"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorGrade)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Grade Completion Ladder Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Grade Completion (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={gradeCompletion}
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

      {/* Search */}
      {selectedAssignment && (
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Submissions Table */}
      {selectedAssignment && (
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedAssignmentData?.title} - Submissions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Total Points: {selectedAssignmentData?.total_points}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {submission.student?.first_name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div className="ml-4">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.submitted_at
                          ? new Date(
                              submission.submitted_at
                            ).toLocaleDateString()
                          : "Not submitted"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={selectedAssignmentData?.total_points}
                            value={grades[submission.id]?.grade || ""}
                            onChange={(e) =>
                              handleGradeChange(
                                submission.id,
                                "grade",
                                e.target.value
                              )
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">
                            / {selectedAssignmentData?.total_points}
                          </span>
                          {grades[submission.id]?.grade && (
                            <span
                              className={`text-sm font-medium ${getGradeColor(
                                grades[submission.id].grade,
                                selectedAssignmentData?.total_points
                              )}`}
                            >
                              (
                              {Math.round(
                                (grades[submission.id].grade /
                                  selectedAssignmentData?.total_points) *
                                  100
                              )}
                              %)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={grades[submission.id]?.feedback || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              submission.id,
                              "feedback",
                              e.target.value
                            )
                          }
                          placeholder="Add feedback..."
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedAssignment && filteredSubmissions.length === 0 && (
        <div className="bg-blue-100 p-12 rounded-xl shadow text-center">
          <div className="text-gray-500 text-lg">No submissions found</div>
          <p className="text-gray-400 mt-2">
            There are no submissions for the selected assignment.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherGrades;
