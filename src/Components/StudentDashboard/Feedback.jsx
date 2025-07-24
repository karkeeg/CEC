import React, { useState } from "react";
import {
  FaUser,
  FaBookOpen,
  FaSearch,
  FaCalendarAlt,
  FaFilePdf,
  FaStar,
  FaEye,
} from "react-icons/fa";

const feedbackData = [
  {
    id: 1,
    assignment_title: "Essay on Climate Change",
    subject_id: "English Literature",
    submission_date: "2025-01-15",
    feedback_text:
      "Excellent analysis of the topic. Well-structured arguments with good supporting evidence. Minor grammar issues need attention.",
    score: 85,
    teacher_name: "Dr. Sarah Johnson",
  },
  {
    id: 2,
    assignment_title: "Physics Lab Report",
    subject_id: "Physics",
    submission_date: "2025-01-12",
    feedback_text:
      "Good experimental setup and methodology. Calculations are accurate. Consider improving the conclusion section.",
    score: 92,
    teacher_name: "Prof. Michael Chen",
  },
  {
    id: 3,
    assignment_title: "Mathematics Problem Set",
    subject_id: "Advanced Calculus",
    submission_date: "2025-01-10",
    feedback_text:
      "Most solutions are correct. Show more detailed steps in problem 3 and 7. Good work on derivatives.",
    score: 78,
    teacher_name: "Dr. Emily Rodriguez",
  },
  {
    id: 4,
    assignment_title: "Chemistry Research Paper",
    subject_id: "Organic Chemistry",
    submission_date: "2025-01-08",
    feedback_text:
      "Comprehensive research with excellent references. Lab procedures are well documented. Outstanding work!",
    score: 95,
    teacher_name: "Prof. David Thompson",
  },
  {
    id: 5,
    assignment_title: "History Term Paper",
    subject_id: "World History",
    submission_date: "2025-01-05",
    feedback_text:
      "Good historical analysis but needs more primary sources. Timeline is accurate. Improve citation format.",
    score: 82,
    teacher_name: "Dr. Lisa Williams",
  },
];

const Feedback = () => {
  const [feedback, setFeedback] = useState(feedbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
              {feedback.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-blue-50 transition duration-200"
                >
                  {/* Assignment */}
                  <td className="py-4 px-5 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FaBookOpen className="text-blue-500" />
                      <span>{item.assignment_title}</span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="py-4 px-5 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-green-500" />
                      <span>{item.subject_id}</span>
                    </div>
                  </td>

                  {/* Submission Date */}
                  <td className="py-4 px-5 text-sm text-gray-600 whitespace-nowrap">
                    {item.submission_date}
                  </td>

                  {/* Feedback */}
                  <td className="py-4 px-5 text-sm max-w-xs truncate">
                    {item.feedback_text}
                  </td>

                  {/* Score */}
                  <td className="py-4 px-5 text-sm text-gray-800 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.floor(item.score / 20) }).map(
                        (_, i) => (
                          <FaStar key={i} className="text-yellow-400 text-xs" />
                        )
                      )}
                      <span className="ml-1 font-medium">{item.score}%</span>
                    </div>
                  </td>

                  {/* View Button */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Feedback;
