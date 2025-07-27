import React, { useEffect, useState } from "react";
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
} from "../../supabaseConfig/supabaseApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaTrash, FaEye, FaEdit } from "react-icons/fa";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "../Modal";

const StudentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [yearChartData, setYearChartData] = useState([]);
  const [genderChartData, setGenderChartData] = useState([]);
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const data = await getAllStudents();
    if (data) {
      console.log(`Fetched ${data.length} students from database`);
      console.log("First few students:", data.slice(0, 3));
      console.log("Last few students:", data.slice(-3));
      setStudents(data);
      prepareCharts(data);
    }
  };

  const prepareCharts = (data) => {
    // Year Chart
    const yearGroups = data.reduce((acc, student) => {
      acc[student.year] = (acc[student.year] || 0) + 1;
      return acc;
    }, {});
    setYearChartData(
      Object.entries(yearGroups).map(([year, count]) => ({ year, count }))
    );

    // Gender Chart
    const genderGroups = data.reduce(
      (acc, student) => {
        if (student.gender?.toLowerCase() === "male") acc.male++;
        else if (student.gender?.toLowerCase() === "female") acc.female++;
        return acc;
      },
      { male: 0, female: 0 }
    );
    setGenderChartData([
      { name: "Male", value: genderGroups.male },
      { name: "Female", value: genderGroups.female },
    ]);
  };

  const handleDelete = async (reg_no) => {
    const error = await deleteStudent(reg_no);
    if (!error) {
      const updated = students.filter((s) => s.reg_no !== reg_no);
      setStudents(updated);
      prepareCharts(updated);
    }
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setEditForm({ ...student });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    const { reg_no, ...updates } = editForm;
    const error = await updateStudent(reg_no, updates);
    setEditLoading(false);
    if (!error) {
      setStudents((prev) =>
        prev.map((s) => (s.reg_no === reg_no ? { ...s, ...updates } : s))
      );
      setEditStudent(null);
    } else {
      alert(
        "Failed to update student: " + (error.message || JSON.stringify(error))
      );
    }
  };

  const filteredStudents = students.filter((s) => {
    // Create full name string and clean it
    const fullName = `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // Replace multiple spaces with single space

    // Clean search term
    const cleanSearchTerm = searchTerm
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

    // Check if search term is empty or matches
    let nameMatch = false;

    if (cleanSearchTerm === "") {
      nameMatch = true; // Show all when search is empty
    } else {
      // Check for exact phrase match
      nameMatch = fullName.includes(cleanSearchTerm);

      // If no exact match, check for individual word matches
      if (!nameMatch) {
        const searchWords = cleanSearchTerm
          .split(" ")
          .filter((word) => word.length > 0);
        const nameWords = fullName.split(" ").filter((word) => word.length > 0);

        // Check if all search words are found in name words
        nameMatch = searchWords.every((searchWord) =>
          nameWords.some((nameWord) => nameWord.includes(searchWord))
        );
      }
    }

    const yearMatch =
      yearFilter === "all" || String(s.year) === String(yearFilter);

    return nameMatch && yearMatch;
  });

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Students Report", 40, 40);
    autoTable(doc, {
      startY: 60,
      head: [["Name", "Email", "Gender", "Year"]],
      body: filteredStudents.map((s) => [
        `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`.trim(),
        s.email,
        s.gender,
        s.year,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    doc.save("students-report.pdf");
  };

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 text-black border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 min-w-0">
        <h1 className="text-3xl font-bold">Student Management Dashboard</h1>
        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 min-w-0">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-4 py-2 rounded w-full max-w-md"
            />
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="border px-3 py-2 rounded text-sm"
            >
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {(searchTerm || yearFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setYearFilter("all");
                setVisibleCount(5);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Total Count Display */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Total Students:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                {students.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                Filtered Results:
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                {filteredStudents.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Showing:</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
                {Math.min(visibleCount, filteredStudents.length)} of{" "}
                {filteredStudents.length}
              </span>
            </div>
          </div>

          {/* Year Distribution Summary */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Year Distribution:
            </div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((year) => {
                const yearCount = students.filter(
                  (s) => String(s.year) === String(year)
                ).length;
                const filteredYearCount = filteredStudents.filter(
                  (s) => String(s.year) === String(year)
                ).length;
                return (
                  <div key={year} className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">Year {year}:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        yearFilter === "all" || yearFilter === String(year)
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {filteredYearCount}
                      {yearFilter === "all" && `/${yearCount}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div
        className="overflow-x-auto shadow rounded border mb-8 min-w-0"
        id="students-table"
      >
        <table className="min-w-full border-collapse text-left text-sm md:text-base">
          <thead className="bg-[#1E6C7B] text-white">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Gender</th>
              <th className="py-3 px-4">Year</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No student found.
                </td>
              </tr>
            ) : (
              filteredStudents.slice(0, visibleCount).map((student) => (
                <tr key={student.reg_no} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-3">
                    {student.first_name} {student.middle_name ?? ""}{" "}
                    {student.last_name}
                  </td>
                  <td className="px-4 py-3">{student.email}</td>
                  <td className="px-4 py-3">{student.gender}</td>
                  <td className="px-4 py-3">{student.year}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => setViewStudent(student)}
                    >
                      <FaEye />
                    </button>
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleEdit(student)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleDelete(student.reg_no)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div className="text-center mt-4 mb-4">
          <div className="flex justify-center gap-3">
            {/* Show Less Button */}
            {visibleCount > 5 && (
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                onClick={() => setVisibleCount((prev) => Math.max(5, prev - 5))}
              >
                Show Less
              </button>
            )}

            {/* Show More Button */}
            {visibleCount < filteredStudents.length && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                onClick={() => setVisibleCount((prev) => prev + 5)}
              >
                Show More
              </button>
            )}

            {/* Show All Button */}
            {visibleCount < filteredStudents.length && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                onClick={() => setVisibleCount(filteredStudents.length)}
              >
                Show All
              </button>
            )}

            {/* Collapse All Button */}
            {visibleCount > 5 && visibleCount === filteredStudents.length && (
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
                onClick={() => setVisibleCount(5)}
              >
                Collapse All
              </button>
            )}
          </div>

          {/* Pagination Info */}
          {filteredStudents.length > 5 && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {Math.min(visibleCount, filteredStudents.length)} of{" "}
              {filteredStudents.length} students
            </div>
          )}
        </div>
      </div>

      {/* View Student Modal */}
      {viewStudent && (
        <Modal title="Student Details" onClose={() => setViewStudent(null)}>
          <div className="space-y-2">
            <div>
              <strong>Name:</strong> {viewStudent.first_name}{" "}
              {viewStudent.middle_name ?? ""} {viewStudent.last_name}
            </div>
            <div>
              <strong>Email:</strong> {viewStudent.email}
            </div>
            <div>
              <strong>Gender:</strong> {viewStudent.gender}
            </div>
            <div>
              <strong>Year:</strong> {viewStudent.year}
            </div>
            <div>
              <strong>Phone:</strong> {viewStudent.phone}
            </div>
            <div>
              <strong>Date of Birth:</strong> {viewStudent.dob}
            </div>
            <div>
              <strong>Address:</strong> {viewStudent.address}
            </div>
            {/* Add more fields as needed */}
          </div>
        </Modal>
      )}
      {/* Edit Student Modal */}
      {editStudent && (
        <Modal title="Edit Student" onClose={() => setEditStudent(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  name="first_name"
                  value={editForm.first_name || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Middle Name
                </label>
                <input
                  name="middle_name"
                  value={editForm.middle_name || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  name="last_name"
                  value={editForm.last_name || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  name="gender"
                  value={editForm.gender || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  name="year"
                  value={editForm.year || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of Birth
                </label>
                <input
                  name="dob"
                  value={editForm.dob || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                  type="date"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  name="address"
                  value={editForm.address || ""}
                  onChange={handleEditChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setEditStudent(null)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Charts */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <div className="w-full h-72 bg-blue-50 rounded-lg p-3 sm:p-4 min-w-0">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Students by Year
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData}>
              <XAxis dataKey="year" />
              <YAxis
                domain={[
                  0,
                  Math.max(...yearChartData.map((item) => item.count), 500),
                ]}
                tickCount={
                  Math.ceil(
                    Math.max(...yearChartData.map((item) => item.count), 500) /
                      500
                  ) + 1
                }
                interval={0}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#3182CE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full h-72 bg-pink-50 rounded-lg p-3 sm:p-4 min-w-0 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Gender Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                <Cell fill="#63b3ed" />
                <Cell fill="#f687b3" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
