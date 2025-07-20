import React, { useEffect, useState } from "react";
import { getAllClasses } from "../../supabaseConfig/supabaseApi";

import {
  FaUser,
  FaBookOpen,
  FaLink,
  FaChevronDown,
  FaSearch,
  FaCalendarAlt,
  FaFilePdf,
} from "react-icons/fa";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const data = await getAllClasses();
      setClasses(data);
      setLoading(false);
    };
    fetchClasses();
  }, []);

  return (
    <div className="p-4 text-black bg-white">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Class Schedule Overview
      </h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <button className="flex items-center gap-2 bg-[#007bff] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          <FaCalendarAlt /> 2025-01-01
        </button>

        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search classes..."
            className="w-full py-2 pl-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <FaSearch className="absolute right-3 top-2.5 text-gray-400" />
        </div>

        <button className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          <FaFilePdf /> Export PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg rounded-md border">
        {loading ? (
          <p className="p-4">Loading classes...</p>
        ) : error ? (
          <p className="p-4 text-red-600">Error: {error.message}</p>
        ) : (
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-[#1E6C7B] text-white">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Class ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Teacher Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Subject</th>
                <th className="py-3 px-4 whitespace-nowrap">Room</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls, idx) => {
                const teacher = cls.teacher;
                const fullName = teacher
                  ? `${teacher.first_name ?? ""} ${teacher.middle_name ?? ""} ${
                      teacher.last_name ?? ""
                    }`.trim()
                  : "Unknown";

                return (
                  <tr
                    key={idx}
                    className="bg-blue-50 hover:bg-blue-200 transition border-t"
                  >
                    <td className="py-3 px-4 flex items-center gap-2 whitespace-nowrap">
                      <FaBookOpen /> {cls.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{fullName}</td>
                    <td className="py-3 px-4 flex items-center gap-2 whitespace-nowrap">
                      <FaUser /> {cls.subject.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button className="flex items-center gap-2 text-blue-600 hover:underline">
                        {cls.room_no}
                        <FaChevronDown className="text-xs" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Classes;
