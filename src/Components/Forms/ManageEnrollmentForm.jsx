import React, { useEffect, useState, useRef } from "react";
import {
  fetchStudents,
  updateStudentClass,
} from "../../supabaseConfig/supabaseApi";

const ManageEnrollmentForm = ({ user, classId, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allStudents = await fetchStudents();
      setStudents(allStudents);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student.id);
    setSearch(`${student.first_name} ${student.last_name} (${student.email})`);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowDropdown(false), 100); // Delay to allow click
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !classId) {
      alert("Please select a student.");
      return;
    }
    setLoading(true);
    await updateStudentClass(selectedStudent, classId);
    setLoading(false);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label className="block mb-1 font-medium">
          Search and Select Student
        </label>
        <input
          type="text"
          ref={inputRef}
          className="border px-3 py-2 rounded w-full"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedStudent("");
            setShowDropdown(true);
          }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoComplete="off"
        />
        {showDropdown && filteredStudents.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto rounded shadow">
            {filteredStudents.map((s) => (
              <li
                key={s.id}
                className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                onMouseDown={() => handleSelectStudent(s)}
              >
                {s.first_name} {s.last_name} ({s.email})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Saving..." : "Assign Student"}
        </button>
        <button
          type="button"
          className="bg-gray-300 px-4 py-2 rounded"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ManageEnrollmentForm;
