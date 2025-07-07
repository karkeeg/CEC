import React from "react";
import {
  FaUser,
  FaBookOpen,
  FaLink,
  FaChevronDown,
  FaSearch,
  FaCalendarAlt,
  FaFilePdf,
} from "react-icons/fa";

const classes = [
  {
    course: "MSC Engineering (Proposed)",
    code: "MSC001",
    teacher: "Dr. Sharma",
    resources: "View materials",
  },
  {
    course: "Bachelor In Civil Engineering",
    code: "BCE001",
    teacher: "Prof. Singh",
    resources: "View materials",
  },
  {
    course: "Bachelor in Electrical Engineering",
    code: "BEE001",
    teacher: "Dr. Rai",
    resources: "View materials",
  },
  {
    course: "Bachelor of Information Technology",
    code: "BIT001",
    teacher: "Prof. Joshi",
    resources: "View materials",
  },
  {
    course: "Diploma In Civil Engineering",
    code: "DCE001",
    teacher: "Mr. Thapa",
    resources: "View materials",
  },
  {
    course: "Diploma In Electrical Engineering",
    code: "DEE001",
    teacher: "Ms. Lama",
    resources: "View materials",
  },
  {
    course: "Pre Diploma in Electrical Engineering",
    code: "PDEE001",
    teacher: "Mr. Karki",
    resources: "View materials",
  },
  {
    course: "Pre Diploma In Civil Engineering",
    code: "PDCE001",
    teacher: "Ms. Shrestha",
    resources: "View materials",
  },
  {
    course: "Pre Diploma In Computer Engineering",
    code: "PDCompE001",
    teacher: "Mr. Bista",
    resources: "View materials",
  },
  {
    course: "General Medicine (HA)",
    code: "HA001",
    teacher: "Dr. Basnet",
    resources: "View materials",
  },
  {
    course: "Diploma in Radiography",
    code: "DR001",
    teacher: "Ms. Gurung",
    resources: "View materials",
  },
  {
    course: "PCL Health Lab Technician",
    code: "PCLHLT001",
    teacher: "Dr. Yadav",
    resources: "View materials",
  },
  {
    course: "Masters In Business Administration",
    code: "MBA001",
    teacher: "Prof. Mishra",
    resources: "View materials",
  },
  {
    course: "Bachelor Of Business Administration",
    code: "BBA001",
    teacher: "Prof. Pandey",
    resources: "View materials",
  },
  {
    course: "Diploma in Pharmacy",
    code: "DPH001",
    teacher: "Ms. Kafle",
    resources: "View materials",
  },
];

const Classes = () => {
  return (
    <div className="ml-64  md:ml-64  p-4 text-black bg-white">
      {/* Section Title */}
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
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-[#1E6C7B] text-white">
            <tr>
              <th className="py-3 px-4 whitespace-nowrap">Course</th>
              <th className="py-3 px-4 whitespace-nowrap">Code</th>
              <th className="py-3 px-4 whitespace-nowrap">Teacher</th>
              <th className="py-3 px-4 whitespace-nowrap">Resources</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls, idx) => (
              <tr
                key={idx}
                className={`${
                  cls.course === "Physics" && idx === 3
                    ? "bg-indigo-100"
                    : "bg-blue-50"
                } hover:bg-blue-200 transition border-t`}
              >
                <td className="py-3 px-4 flex items-center gap-2 whitespace-nowrap">
                  <FaBookOpen /> {cls.course}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">{cls.code}</td>
                <td className="py-3 px-4 flex items-center gap-2 whitespace-nowrap">
                  <FaUser /> {cls.teacher}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <button className="flex items-center gap-2 text-blue-600 hover:underline">
                    <FaLink /> View materials
                    <FaChevronDown className="text-xs" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Classes;
