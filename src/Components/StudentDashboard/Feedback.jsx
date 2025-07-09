import React from "react";
import { FaSearch, FaEye, FaStar } from "react-icons/fa";
import { IoMdDownload } from "react-icons/io";
import { LuCalendarDays } from "react-icons/lu";
import { MdSummarize } from "react-icons/md";

// Data
const assignments = [
  {
    title: "Essay on climates",
    subject: "📖 English",
    date: "12-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Physics numerical",
    subject: "📖 Physics",
    date: "27-07-2025",
    feedback: "Good Work on your assignment…",
    score: 90,
    stars: 4,
  },
  {
    title: "Essay on climates",
    subject: "📖 English",
    date: "27-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Essay on climates",
    subject: "📖 English",
    date: "27-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
    highlight: true,
  },
  {
    title: "Derivates",
    subject: "📖 Mathematics",
    date: "27-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Grammar",
    subject: "📖 English",
    date: "12-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Chemistry practical",
    subject: "📖 Chemistry",
    date: "12-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Derivates",
    subject: "📖 Mathematics",
    date: "12-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Derivates",
    subject: "📖 Mathematics",
    date: "27-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Derivates",
    subject: "📖 Mathematics",
    date: "27-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
  {
    title: "Derivates",
    subject: "📖 Mathematics",
    date: "12-07-2025",
    feedback: "Good Work on your assignment…",
    score: 78,
    stars: 3,
  },
];

const Feedback = () => {
  return (
    <div className="ml-64 lg:ml-64 w-full min-h-screen p-2 sm:p-4 bg-gray-50 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-[1300px] bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Feedback
          </h1>
        </div>

        {/* Top Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 p-3 sm:p-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded flex items-center justify-between gap-2 w-full text-sm">
            <span>2025-01-01</span>
            <LuCalendarDays />
          </button>

          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded flex items-center justify-between gap-2 w-full text-sm">
            <span>Score</span>
            <FaStar />
          </button>

          <div className="flex items-center bg-cyan-600 rounded px-2 py-2 w-full">
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent w-full text-white placeholder-white text-sm focus:outline-none"
            />
            <FaSearch className="text-white" />
          </div>

          <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded flex items-center justify-between gap-2 w-full text-sm">
            <span>Summary</span>
            <MdSummarize />
          </button>

          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center justify-between gap-2 w-full text-sm">
            <span>Export PDF</span>
            <IoMdDownload />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800 table-auto">
            <thead className="bg-[#135273] text-white">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  Assignment
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  Subject
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  Submission
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  Feedback
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Score</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">View</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item, idx) => (
                <tr
                  key={idx}
                  className={`${
                    item.highlight ? "bg-indigo-200" : "bg-blue-50"
                  } border-b border-gray-200`}
                >
                  <td className="px-4 py-2 font-medium whitespace-nowrap max-w-[160px] truncate">
                    {item.title}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {item.subject}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-2 max-w-[200px] truncate">
                    {item.feedback}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap flex items-center gap-1">
                    {Array.from({ length: item.stars }).map((_, i) => (
                      <FaStar key={i} className="text-yellow-400 text-xs" />
                    ))}
                    <span>{item.score}%</span>
                  </td>
                  <td className="px-4 py-2">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                      View <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
