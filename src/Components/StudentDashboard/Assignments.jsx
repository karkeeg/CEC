import React, { useState, useEffect } from "react";
import supabase from "../../supabaseConfig/supabaseClient"; // adjust path
import { FaLink, FaSearch, FaDownload, FaCheck } from "react-icons/fa";
import { IoMdArrowDropdown } from "react-icons/io";
import { BiReset } from "react-icons/bi";
import { MdAssignmentLate } from "react-icons/md";
import { IoBookOutline } from "react-icons/io5";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("2025-01-01");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          id,
          title,
          due_date,
          teacher_id,
          
          description,
          subject:subject_id (
            name
          )
          /* optionally include teacher info here if needed */
        `
        )
        .gte("due_date", date) // filter due_date >= selected date
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching assignments:", error);
      } else {
        setAssignments(data);
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [date]);

  // Filter assignments by search term on title (case-insensitive)
  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ml-64 flex flex-col lg:flex-row min-h-screen bg-white">
      <main className="w-full p-4 sm:p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Assignments
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Manage your assignments, view due dates, and track submission
            status.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md outline-none cursor-pointer w-full md:w-auto"
          />
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 rounded-md pl-10 border border-gray-300 text-black"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md flex items-center gap-2 text-white shadow-md w-full md:w-auto justify-center">
            Export PDF <FaDownload />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <p className="p-4 text-center text-gray-500">
              Loading assignments...
            </p>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-cyan-900 text-white text-sm">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-3 text-center text-gray-600"
                    >
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a, i) => (
                    <tr
                      key={a.id}
                      className={`border-b ${
                        i % 2 === 0
                          ? "bg-blue-100 text-black"
                          : "bg-indigo-100 text-black"
                      }`}
                    >
                      <td className="px-4 py-3">{a.title}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <IoBookOutline />
                        {a.subject?.name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(a.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        {a.teacher_id}
                      </td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-2 text-blue-700 hover:underline">
                          <FaLink />
                          {a.action ?? "View Submission"}
                          <IoMdArrowDropdown />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assignments;
