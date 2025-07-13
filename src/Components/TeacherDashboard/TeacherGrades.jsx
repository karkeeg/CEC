import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
  FaGraduationCap,
} from "react-icons/fa";

const TeacherGrades = () => {
  const { user } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;

      try {
        const { data: assignmentData, error } = await supabase
          .from("assignments")
          .select(
            `
            id,
            title,
            total_points,
            due_date,
            class:class_id (
              id,
              name
            )
          `
          )
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setAssignments(assignmentData || []);
        if (assignmentData && assignmentData.length > 0) {
          setSelectedAssignment(assignmentData[0].id);
        }
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
        const { data: submissionData, error } = await supabase
          .from("assignment_submissions")
          .select(
            `
            id,
            student:student_id (
              id,
              first_name,
              middle_name,
              last_name,
              email
            ),
            submitted_at,
            grade,
            feedback
          `
          )
          .eq("assignment_id", selectedAssignment);

        if (error) throw error;

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
        const { error } = await supabase
          .from("assignment_submissions")
          .update({
            grade: update.grade,
            feedback: update.feedback,
          })
          .eq("id", update.id);

        if (error) throw error;
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Grades</h1>
        <p className="text-gray-600">Manage and grade student assignments</p>
      </div>

      {/* Assignment Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
          <div className="bg-white p-6 rounded-lg shadow-md">
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

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Graded</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.graded}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <FaEdit className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Average Grade
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.average}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <FaChartBar className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {selectedAssignment && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
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
