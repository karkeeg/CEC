import React, { useEffect, useState, useRef } from "react";
import Swal from 'sweetalert2';
import {
  fetchStudents,
  enrollStudentsInClass,
} from "../../supabaseConfig/supabaseApi";

const ManageEnrollmentForm = ({
  user,
  classId,
  classYear,
  classCapacity,
  currentEnrolled = 0,
  onClose,
  onSuccess,
}) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const [capacityError, setCapacityError] = useState("");

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
    (s) => {
      // First filter by year if classYear is provided
      if (classYear && s.year !== classYear) {
        return false;
      }
      // Then filter by search term
      return (
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  const maxReached =
    classCapacity && currentEnrolled + selectedStudents.length > classCapacity;

  const handleToggleStudent = (studentId) => {
    // Only block if adding this student would exceed capacity
    if (
      classCapacity &&
      currentEnrolled +
        selectedStudents.length +
        (!selectedStudents.includes(studentId) ? 1 : 0) >
        classCapacity
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Capacity Full',
        text: 'Student capacity is full. Please increase the class capacity to add more students.',
        customClass: {
          popup: 'swal-small'
        }
      });
      return;
    }
    setSelectedStudents((prev) => {
      const updated = prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId];
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
      Swal.fire({
        icon: 'warning',
        title: 'No Student Selected',
        text: 'Please select at least one student.',
        customClass: {
          popup: 'swal-small'
        }
      });
      return;
    }
    if (
      classCapacity &&
      currentEnrolled + selectedStudents.length > classCapacity
    ) {
      setCapacityError(
        "Student capacity is full. Please increase the class capacity to add more students."
      );
      return;
    }
    setCapacityError("");
    setLoading(true);
    const error = await enrollStudentsInClass(selectedStudents, classId);
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Enrollment Error',
        text: 'Error enrolling students: ' + error.message,
        customClass: {
          popup: 'swal-small'
        }
      });
      setLoading(false);
      return;
    }
    setLoading(false);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 w-full  mx-auto p-4 ">
      {/* Main form area */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-6 min-w-[320px]">
        <label className="block font-semibold text-xl text-gray-800">
          Search & Select Students
          {classYear && (
            <span className="block text-sm font-normal text-blue-600 mt-1">
              Showing only Year {classYear} students
            </span>
          )}
        </label>
        <input
          type="text"
          ref={inputRef}
          className="border px-4 py-2 rounded-lg w-full text-base shadow focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>
            Capacity: <b>{classCapacity}</b>
          </span>
          <span>
            Enrolled: <b>{currentEnrolled}</b>
          </span>
          <span>
            Selected: <b>{selectedStudents.length}</b>
          </span>
          {classYear && (
            <span>
              Available Year {classYear}: <b>{filteredStudents.length}</b>
            </span>
          )}
        </div>
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-base font-semibold shadow transition"
            disabled={loading || maxReached}
          >
            {loading ? "Saving..." : "Assign Students"}
          </button>
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg text-base font-semibold shadow transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
        {maxReached && (
          <div className="text-xs text-red-500 mt-2 font-semibold">
            Class capacity reached. Deselect a student or increase capacity to
            add more.
          </div>
        )}
        {capacityError && (
          <div className="text-xs text-red-500 mt-2">{capacityError}</div>
        )}
      </form>
      {/* Student dropdown area, visually offset to the right and flows out of the box */}
      <div className="relative flex-1 max-w-md w-full mt-4 md:mt-0 md:ml-2">
        {showDropdown && (
          <div className=" z-40 left- md:left-[10%] top-0 bg-gray-50 border border-blue-200 w-full md:w-80 max-h-64 overflow-y-auto rounded-xl shadow-2xl transition">
            {filteredStudents.length > 0 ? (
            <ul className="p-0 m-0">
              {filteredStudents.map((s) => (
                <li
                  key={s.id}
                  className="px-3 py-2 hover:bg-blue-100 flex items-center cursor-pointer rounded mb-1 text-sm transition"
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
                      className="mr-2 scale-100 accent-blue-600"
                      disabled={maxReached && !selectedStudents.includes(s.id)}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {s.first_name} {s.last_name}{" "}
                        <span className="text-gray-500 text-xs">
                          ({s.email}) - Year {s.year}
                        </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {classYear 
                  ? `No Year ${classYear} students found matching your search.`
                  : "No students found matching your search."
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEnrollmentForm;
