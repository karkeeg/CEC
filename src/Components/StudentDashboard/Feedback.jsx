import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaBookOpen,
  FaSearch,
  FaCalendarAlt,
  FaFilePdf,
  FaStar,
  FaEye,
  FaStarHalfAlt,
  FaRegStar,
} from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import {
  getFeedbackForStudent,
  fetchTeachers,
} from "../../supabaseConfig/supabaseApi";
import Modal from "../Modal";

const Feedback = () => {
  const { user } = useUser();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [teacherMap, setTeacherMap] = useState({});

  const renderStars = (value, max = 5) => {
    const stars = [];
    for (let i = 1; i <= max; i++) {
      if (value >= i) {
        stars.push(<FaStar key={i} className="text-yellow-400 text-xs" />);
      } else if (value >= i - 0.5) {
        stars.push(
          <FaStarHalfAlt key={i} className="text-yellow-400 text-xs" />
        );
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300 text-xs" />);
      }
    }
    return stars;
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await getFeedbackForStudent(user.id);
        setFeedback(data || []);
        setError(null);
      } catch (err) {
        setError(err);
        setFeedback([]);
      }
      setLoading(false);
    };
    fetchFeedback();
  }, [user]);

  useEffect(() => {
    // Fetch teachers for checked by name lookup
    const fetchAllTeachers = async () => {
      try {
        const data = await fetchTeachers();
        setTeachers(data || []);
        // Build a map: id -> full name
        const map = {};
        (data || []).forEach((t) => {
          map[t.id] = [t.first_name, t.middle_name, t.last_name]
            .filter(Boolean)
            .join(" ");
        });
        setTeacherMap(map);
      } catch {}
    };
    fetchAllTeachers();
  }, []);

  return (
    <div className="p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black w-full min-w-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Feedback Overview
      </h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 min-w-0">
        <button className="flex items-center gap-2 bg-[#007bff] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          <FaCalendarAlt /> 2025-01-01
        </button>

        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search feedback..."
            className="w-full py-2 pl-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <FaSearch className="absolute right-3 top-2.5 text-gray-400" />
        </div>

        <button className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          <FaFilePdf /> Export PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 min-w-0">
        {loading ? (
          <p className="p-4">Loading feedback...</p>
        ) : error ? (
          <p className="p-4 text-red-600">Error: {error.message}</p>
        ) : (
          <table className="min-w-full table-auto divide-y divide-gray-200 text-sm md:text-base">
            <thead className="bg-[#1E6C7B] text-white sticky top-0">
              <tr>
                <th className="py-3 px-5 text-sm font-semibold text-left">
                  Assignment
                </th>
                <th className="py-3 px-5 text-sm font-semibold text-left">
                  Subject
                </th>
                <th className="py-3 px-5 text-sm font-semibold text-left">
                  Submission Date
                </th>
                <th className="py-3 px-5 text-sm font-semibold text-left">
                  Feedback
                </th>
                <th className="py-3 px-5 text-sm font-semibold text-left">
                  Score
                </th>
                <th className="py-3 px-5 text-sm font-semibold text-left">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-gray-500 text-center">
                    No feedback found.
                  </td>
                </tr>
              ) : (
                feedback.map((item, idx) => {
                  const assignment = item.assignment || {};
                  const subjectName = assignment.subject?.name || "-";
                  const grade = item.grade || {};
                  // Prefer rating (decimal, e.g., 3.5) if available, else grade (percentage)
                  const score =
                    grade.rating != null ? grade.rating : grade.grade;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50 transition duration-200"
                    >
                      {/* Assignment */}
                      <td className="py-4 px-5 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaBookOpen className="text-blue-500" />
                          <span>{assignment.title || "-"}</span>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-4 px-5 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-green-500" />
                          <span>{subjectName}</span>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-4 px-5 text-sm text-gray-600 whitespace-nowrap">
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* Feedback */}
                      <td className="py-4 px-5 text-sm max-w-xs truncate">
                        {grade.feedback || "-"}
                      </td>

                      {/* Score */}
                      <td className="py-4 px-5 text-sm text-gray-800 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {grade.grade != null && !isNaN(grade.grade) ? (
                            <div className="flex items-center gap-1">
                              {renderStars((grade.grade / 100) * 5, 5)}
                              <span className="ml-1 font-medium">
                                {grade.grade}%
                              </span>
                            </div>
                          ) : (
                            <span className="ml-1 font-medium">-</span>
                          )}
                        </div>
                      </td>

                      {/* View Button */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <button
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={() => setViewModal(item)}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for viewing feedback details */}
      {viewModal && (
        <Modal title={"Feedback Details"} onClose={() => setViewModal(null)}>
          <div className="p-4 max-w-md w-full">
            <div className="mb-2">
              <strong>Assignment:</strong> {viewModal.assignment?.title || "-"}
            </div>
            <div className="mb-2">
              <strong>Subject:</strong>{" "}
              {viewModal.assignment?.subject?.name || "-"}
            </div>
            <div className="mb-2">
              <strong>Submission Date:</strong>{" "}
              {viewModal.submitted_at
                ? new Date(viewModal.submitted_at).toLocaleDateString()
                : "-"}
            </div>
            <div className="mb-2">
              <strong>Feedback:</strong> {viewModal.grade?.feedback || "-"}
            </div>
            <div className="mb-2 flex items-center gap-2">
              <strong>Grade:</strong>
              {viewModal.grade?.grade != null &&
              !isNaN(viewModal.grade.grade) ? (
                <>
                  {renderStars((viewModal.grade.grade / 100) * 5, 5)}
                  <span className="ml-1 font-medium">
                    {viewModal.grade.grade}%
                  </span>
                </>
              ) : (
                <span>-</span>
              )}
            </div>
            <div className="mb-2">
              <strong>Checked by:</strong>{" "}
              {viewModal.grade?.rated_by
                ? teacherMap[viewModal.grade.rated_by] ||
                  viewModal.grade.rated_by
                : "-"}
            </div>
            {viewModal.notes && (
              <div className="mb-2">
                <strong>Submission Notes:</strong> {viewModal.notes}
              </div>
            )}
            {viewModal.files &&
              Array.isArray(viewModal.files) &&
              viewModal.files.length > 0 && (
                <div className="mb-2">
                  <strong>Files:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {viewModal.files.map((fileUrl, idx) => {
                      const fileName = fileUrl.split("/").pop().split("?")[0];
                      return (
                        <li key={idx}>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 underline"
                          >
                          Submitted File
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            <button
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-semibold w-full"
              onClick={() => setViewModal(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Feedback;
