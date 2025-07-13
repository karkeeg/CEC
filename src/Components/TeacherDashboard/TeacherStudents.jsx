import React, { useEffect, useState } from "react";
import supabase from "../../supabaseConfig/supabaseClient";

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("students").select("*");
    if (!error && data) {
      setStudents(data);
      // Extract unique years for filter dropdown
      const uniqueYears = Array.from(new Set(data.map((s) => s.year))).filter(
        Boolean
      );
      setYears(uniqueYears.sort());
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Failed to delete student.");
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesName = `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesYear =
      yearFilter === "all" || String(s.year) === String(yearFilter);
    return matchesName && matchesYear;
  });

  // Only show up to visibleCount students
  const visibleStudents = filteredStudents.slice(0, visibleCount);

  return (
    <div className="p-6 text-black bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">My Students</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-md"
        />
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-xs"
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
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
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : visibleStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No student found.
                </td>
              </tr>
            ) : (
              visibleStudents.map((student) => (
                <tr key={student.id} className="border-b hover:bg-blue-50">
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
                      View
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleDelete(student.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Show More / Show Less Buttons */}
        <div className="flex justify-center gap-4 my-4">
          {visibleCount < filteredStudents.length && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setVisibleCount((prev) => prev + 5)}
            >
              Show More
            </button>
          )}
          {visibleCount > 5 && (
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={() => setVisibleCount((prev) => Math.max(5, prev - 5))}
            >
              Show Less
            </button>
          )}
        </div>
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
    </div>
  );
};

export default TeacherStudents;
