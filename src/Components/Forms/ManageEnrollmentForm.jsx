import React, { useEffect, useState, useRef } from "react";
import {
  fetchStudents,
  enrollStudentsInClass,
} from "../../supabaseConfig/supabaseApi";

const ManageEnrollmentForm = ({ user, classId, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
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

  const handleToggleStudent = (studentId) => {
    setSelectedStudents((prev) => {
      const updated = prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId];
      console.log("Selected students:", updated);
      return updated;
    });
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowDropdown(false), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudents.length || !classId) {
      alert("Please select at least one student.");
      return;
    }
    setLoading(true);
    const error = await enrollStudentsInClass(selectedStudents, classId);
    if (error) {
      alert("Error enrolling students: " + error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label className="block mb-1 font-medium">
          Search and Select Students
        </label>
        <input
          type="text"
          ref={inputRef}
          className="border px-3 py-2 rounded w-full"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        {showDropdown && filteredStudents.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto rounded shadow">
            {filteredStudents.map((s) => (
              <li
                key={s.id}
                className="px-3 py-2 hover:bg-blue-100 flex items-center cursor-pointer"
              >
                <label
                  className="flex items-center w-full cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleToggleStudent(s.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    readOnly
                    className="mr-2"
                  />
                  <span>
                    {s.first_name} {s.last_name} ({s.email})
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {console.log("Current selectedStudents:", selectedStudents)}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Saving..." : "Assign Students"}
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
