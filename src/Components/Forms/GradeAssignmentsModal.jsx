import React, { useEffect, useState } from "react";
import {
  getAssignmentsByTeacher,
  getAssignmentSubmissions,
  updateGrade,
  createGrade,
} from "../../supabaseConfig/supabaseApi";
import { FaSearch, FaEdit, FaGraduationCap } from "react-icons/fa";

const GradeAssignmentsModal = ({
  user,
  onClose,
  assignmentId,
  showStats = true,
  onGradeUpdate,
}) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(
    assignmentId || ""
  );
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [modalSubmission, setModalSubmission] = useState(null);
  const [modalFeedback, setModalFeedback] = useState("");
  const [modalRating, setModalRating] = useState("");
  const [modalGrade, setModalGrade] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      try {
        const assignmentData = await getAssignmentsByTeacher(user.id);
        setAssignments(assignmentData || []);
        if (!assignmentId && assignmentData && assignmentData.length > 0) {
          setSelectedAssignment(assignmentData[0].id);
        }
      } catch (error) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user, assignmentId]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        let submissionData = [];
        if (!selectedAssignment) {
          // All assignments
          const allAssignments = await getAssignmentsByTeacher(user.id);
          const allSubmissions = await getAssignmentSubmissions();
          const teacherAssignmentIds = (allAssignments || []).map((a) => a.id);
          submissionData = (allSubmissions || []).filter((s) =>
            teacherAssignmentIds.includes(s.assignment_id)
          );
        } else {
          submissionData = await getAssignmentSubmissions(selectedAssignment);
        }
        setSubmissions(submissionData || []);
        // Initialize grades state
        const initialGrades = {};
        submissionData?.forEach((submission) => {
          initialGrades[submission.id] = {
            grade: submission.grade?.grade || "",
            feedback: submission.grade?.feedback || "",
            rating: submission.grade?.rating || "",
            gradeId: submission.grade?.id || null,
          };
        });
        setGrades(initialGrades);
      } catch (error) {}
    };
    fetchSubmissions();
  }, [selectedAssignment, user]);

  const handleGradeChange = (submissionId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value,
      },
    }));
  };

  const handleSaveGrade = async () => {
    if (!modalSubmission) return;
    setSaving(true);

    console.log("=== MODAL DEBUG ===");
    console.log("Modal submission:", modalSubmission);
    console.log("User:", user);
    console.log("Modal values:", { modalGrade, modalFeedback, modalRating });

    try {
      let result;
      const gradeData = {
        grade: modalGrade ? parseInt(modalGrade) : null,
        feedback: modalFeedback,
        rating: modalRating ? parseFloat(modalRating) : null,
        rated_by: user?.id || null,
        rated_at: new Date().toISOString(),
      };

      console.log("Grade data prepared:", gradeData);

      if (grades[modalSubmission.id]?.gradeId) {
        // Update existing grade
        result = await updateGrade(
          grades[modalSubmission.id].gradeId,
          gradeData
        );
      } else {
        // Create new grade
        result = await createGrade({
          submission_id: modalSubmission.id,
          ...gradeData,
        });
      }

      if (result.error) {
        throw new Error(
          `Database error: ${
            result.error.message || result.error.details || "Unknown error"
          }`
        );
      }

      if (!result.data || result.data.length === 0) {
        throw new Error("No data returned from database operation");
      }

      // Refresh submissions with updated grade data
      const refreshed = selectedAssignment
        ? await getAssignmentSubmissions(selectedAssignment)
        : (await getAssignmentSubmissions()).filter((s) =>
            assignments.map((a) => a.id).includes(s.assignment_id)
          );

      setSubmissions(refreshed || []);

      // Update grades state with new grade data
      const updatedGrades = { ...grades };
      if (result.data && result.data[0]) {
        updatedGrades[modalSubmission.id] = {
          grade: result.data[0].grade || "",
          feedback: result.data[0].feedback || "",
          rating: result.data[0].rating || "",
          gradeId: result.data[0].id || null,
        };
      }
      setGrades(updatedGrades);

      setShowGradeModal(false);
      setModalSubmission(null);
      setModalFeedback("");
      setModalRating("");
      setModalGrade("");

      // Show success message
      alert("Grade saved successfully!");

      // Notify parent component about the grade update
      if (onGradeUpdate) {
        onGradeUpdate();
      }
    } catch (error) {
      console.error("Error saving grade:", error);
      alert(`Failed to save grade: ${error.message}`);
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

  const stats = getGradeStats();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Assignment Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">
            Select Assignment:
          </label>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
          >
            <option value="">All Assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Grade Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-800">
            Assignment Submissions
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredSubmissions.length} submission
            {filteredSubmissions.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">No submissions found</p>
              <p className="text-sm">
                Students haven't submitted any assignments yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between">
                    {/* Student Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {submission.student?.first_name}{" "}
                          {submission.student?.middle_name || ""}{" "}
                          {submission.student?.last_name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {submission.student?.email}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {assignments.find(
                              (a) => a.id === submission.assignment_id
                            )?.title || "-"}
                          </span>
                          <span className="text-sm text-gray-500">
                            Submitted{" "}
                            {submission.submitted_at
                              ? new Date(
                                  submission.submitted_at
                                ).toLocaleDateString()
                              : "Not submitted"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grade and Action */}
                    <div className="flex items-center space-x-4 ml-4">
                      {submission.grade?.grade && (
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              submission.grade.grade >= 80
                                ? "bg-green-100 text-green-800"
                                : submission.grade.grade >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {submission.grade.grade}%
                          </div>
                          {submission.grade.rating && (
                            <div className="text-xs text-gray-500 mt-1">
                              Rating: {submission.grade.rating}⭐
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          submission.grade?.grade
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
                            : "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md"
                        }`}
                        onClick={() => {
                          setShowGradeModal(true);
                          setModalSubmission(submission);
                          setModalFeedback(submission.grade?.feedback || "");
                          setModalRating(submission.grade?.rating || "");
                          setModalGrade(submission.grade?.grade || "");
                        }}
                      >
                        {submission.grade?.grade ? "Edit Grade" : "Grade Now"}
                      </button>
                    </div>
                  </div>

                  {/* Notes and Feedback */}
                  {(submission.notes || submission.grade?.feedback) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {submission.notes && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            Student Notes:
                          </h5>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            {submission.notes}
                          </p>
                        </div>
                      )}
                      {submission.grade?.feedback && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            Your Feedback:
                          </h5>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-200">
                            {submission.grade.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Feedback/Grade Modal */}
      {showGradeModal && modalSubmission && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow-lg w-full max-w-md mx-2">
            <h2 className="text-lg font-bold mb-4">Give Feedback & Grade</h2>
            <div className="mb-2">
              <strong>Student:</strong> {modalSubmission.student?.first_name}{" "}
              {modalSubmission.student?.last_name}
            </div>
            <div className="mb-2">
              <strong>Notes:</strong> {modalSubmission.notes || "-"}
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Feedback</label>
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
                onClick={handleSaveGrade}
                disabled={saving}
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
  );
};

export default GradeAssignmentsModal;
