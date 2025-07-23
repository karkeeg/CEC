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
            assignments.map((a) => a.id).includes(s.assignment_id)
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
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
          <label className="font-medium text-gray-700">
            Select Assignment:
          </label>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto text-sm h-8"
          >
            <option value="">All Assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>
        {/* Search Student removed */}
      </div>
      {/* Stat cards removed */}
      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider w-32">
                Submitted At
              </th>
              <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider w-56 truncate">
                Notes
              </th>
              <th className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-2 py-4 text-center text-gray-500">
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
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {submission.student?.first_name?.charAt(0) || "S"}
                        </span>
                      </div>
                      <div className="ml-2">
                        <div className="font-medium text-gray-900">
                          {submission.student?.first_name}{" "}
                          {submission.student?.middle_name || ""}{" "}
                          {submission.student?.last_name}
                        </div>
                        <div className="text-gray-500">
                          {submission.student?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-gray-900 w-32">
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleDateString()
                      : "Not submitted"}
                  </td>
                  <td
                    className="px-2 py-4 whitespace-nowrap text-gray-900 w-56 max-w-xs truncate overflow-hidden"
                    title={submission.notes}
                  >
                    {submission.notes || "-"}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium"
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
