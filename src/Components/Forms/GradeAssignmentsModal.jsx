import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import {
  getAssignmentsByTeacher,
  getAssignmentSubmissions,
  updateGrade,
  createGrade,
} from "../../supabaseConfig/supabaseApi";
import { FaSearch, FaEdit, FaGraduationCap } from "react-icons/fa";
import Modal from "../Modal";

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
      Swal.fire({
        icon: 'success',
        title: 'Grade Saved!',
        text: 'Grade has been saved successfully.',
        customClass: { container: 'swal-small' }
      });

      // Notify parent component about the grade update
      if (onGradeUpdate) {
        onGradeUpdate();
      }
    } catch (error) {
      console.error("Error saving grade:", error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: `Failed to save grade: ${error.message}`,
        customClass: { container: 'swal-small' }
      });
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

  // Safely render student notes which may be JSON, Quill Delta, or plain text
  const renderStudentNotes = (notes) => {
    if (!notes) return <span className="text-gray-400">-</span>;

    const tryParse = (val) => {
      if (typeof val !== "string") return val;
      const s = val.trim();
      if (!(s.startsWith("{") || s.startsWith("["))) return null;
      try {
        return JSON.parse(s);
      } catch (e) {
        return null;
      }
    };

    const parsed = tryParse(notes);

    // If Quill Delta format
    if (parsed && parsed.ops && Array.isArray(parsed.ops)) {
      const text = parsed.ops.map((op) => (typeof op.insert === "string" ? op.insert : "")).join("");
      return (
        <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{text}</pre>
      );
    }

    // If array of strings/objects
    if (Array.isArray(parsed)) {
      const items = parsed
        .map((it) => {
          if (typeof it === "string") return it;
          if (it && typeof it === "object") {
            if (typeof it.text === "string") return it.text;
            return JSON.stringify(it);
          }
          return String(it);
        })
        .filter(Boolean);
      return (
        <ul className="list-disc pl-5 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          {items.map((line, idx) => (
            <li key={idx} className="whitespace-pre-wrap">{line}</li>
          ))}
        </ul>
      );
    }

    // If object with a text field
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.text === "string") {
        return (
          <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{parsed.text}</pre>
        );
      }
      // Fallback pretty JSON view
      return (
        <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-3 rounded-md">{JSON.stringify(parsed, null, 2)}</pre>
      );
    }

    // Plain text fallback
    return (
      <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{String(notes)}</pre>
    );
  };

  return (
    <div className="w-full max-w-full mx-auto">
      {/* Assignment Selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <label className="text-sm font-medium text-gray-700">
            Select Assignment:
          </label>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
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

        <div>
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
                  className="p-5 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Student Info */}
                    <div className="md:col-span-7 min-w-0">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                        {submission.student?.first_name} {submission.student?.middle_name || ""} {submission.student?.last_name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {submission.student?.email}
                      </p>
                    </div>

                    {/* Assignment & Submitted */}
                    <div className="md:col-span-3">
                      <div className="flex flex-wrap items-center gap-2 md:justify-start">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-full truncate">
                          {assignments.find((a) => a.id === submission.assignment_id)?.title || "-"}
                        </span>
                        <span className="text-xs md:text-sm text-gray-500">
                          {submission.submitted_at ? `Submitted ${new Date(submission.submitted_at).toLocaleDateString()}` : "Not submitted"}
                        </span>
                      </div>
                    </div>

                    {/* Grade and Action */}
                    <div className="md:col-span-2 flex md:flex-col items-center md:items-end justify-between gap-2 md:gap-3">
                      {submission.grade?.grade ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              submission.grade.grade >= 80
                                ? "bg-green-100 text-green-800"
                                : submission.grade.grade >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {submission.grade.grade}%
                          </span>
                          {submission.grade.rating && (
                            <span className="text-[11px] text-gray-500">{submission.grade.rating}⭐</span>
                          )}
                        </div>
                      ) : (
                        <div className="hidden md:block" />
                      )}

                      <button
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
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
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {submission.notes && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Student Notes:</h5>
                          {renderStudentNotes(submission.notes)}
                        </div>
                      )}
                      {submission.grade?.feedback && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Your Feedback:</h5>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-200">{submission.grade.feedback}</p>
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
        <Modal title="Give Feedback & Grade" onClose={() => setShowGradeModal(false)} size="md" bodyClassName="max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <div>
              <div className="text-sm"><strong>Student:</strong> {modalSubmission.student?.first_name} {modalSubmission.student?.last_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Notes</div>
              <div className="mt-1">{renderStudentNotes(modalSubmission.notes)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Feedback</label>
              <textarea
                className="w-full border rounded px-2 py-1"
                rows={3}
                value={modalFeedback}
                onChange={(e) => setModalFeedback(e.target.value)}
              />
            </div>
            <div>
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
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <input
                className="w-full border rounded px-2 py-1"
                type="number"
                value={modalGrade}
                onChange={(e) => setModalGrade(e.target.value)}
                placeholder="e.g. 90"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
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
        </Modal>
      )}
    </div>
  );
};

export { GradeAssignmentsModal };
export default GradeAssignmentsModal;
