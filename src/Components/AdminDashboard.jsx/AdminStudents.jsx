import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";
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

const StudentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
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
    const { data, error } = await supabase.from("students").select("*");
    if (!error && data) {
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
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("reg_no", reg_no);
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
    const { error } = await supabase
      .from("students")
      .update(updates)
      .eq("reg_no", reg_no);
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

  const filteredStudents = students.filter((s) =>
    `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-black bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Student Management Dashboard</h1>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-md"
        />
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto shadow rounded border mb-8">
        <table className="min-w-full border-collapse text-left">
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
        {visibleCount < filteredStudents.length && (
          <div className="text-center mt-4 mb-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setVisibleCount((prev) => prev + 5)}
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* View Student Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={() => setViewStudent(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Student Details</h2>
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
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={() => setEditStudent(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Edit Student</h2>
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
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    value={editForm.email || ""}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gender
                  </label>
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
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
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
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="w-full h-72 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Students by Year
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3182CE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full h-72 bg-pink-50 rounded-lg p-4">
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
