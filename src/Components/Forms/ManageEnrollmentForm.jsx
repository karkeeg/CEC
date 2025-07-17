import React, { useEffect, useState } from "react";
import {
  fetchStudents,
  getTeacherDepartmentsWithClasses,
  updateStudentClass,
} from "../../supabaseConfig/supabaseApi";

const ManageEnrollmentForm = ({ user, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allStudents = await fetchStudents();
      const teacherClasses = await getTeacherDepartmentsWithClasses(user.id);
      const allClasses = [];
      teacherClasses?.forEach((dept) => {
        dept.classes?.forEach((cls) => {
          allClasses.push({
            id: cls.id,
            name: cls.name,
            department: dept.department.name,
          });
        });
      });
      setStudents(allStudents);
      setClasses(allClasses);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedClass) {
      alert("Please select both student and class.");
      return;
    }
    setLoading(true);
    await updateStudentClass(selectedStudent, selectedClass);
    setLoading(false);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Search Student</label>
        <input
          type="text"
          className="border px-3 py-2 rounded w-full"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Select Student</label>
        <select
          className="border px-3 py-2 rounded w-full"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">-- Select Student --</option>
          {filteredStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name} ({s.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Select Class</label>
        <select
          className="border px-3 py-2 rounded w-full"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} ({cls.department})
            </option>
          ))}
        </select>
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
