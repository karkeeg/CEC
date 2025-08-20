import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import supabase from "../../supabaseConfig/supabaseClient";

const UpdateTeacherModal = ({ teacher, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: teacher.id,
    first_name: teacher.first_name || "",
    middle_name: teacher.middle_name || "",
    last_name: teacher.last_name || "",
    email: teacher.email || "",
    teacher_department: teacher.teacher_department || "",
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("id, name");
      if (error) {
        console.error("Error fetching departments:", error.message);
      } else {
        setDepartments(data);
      }
      setLoading(false);
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (loading) {
    return <Modal onClose={onClose} title="Update Teacher"><p>Loading departments...</p></Modal>;
  }

  return (
    <Modal onClose={onClose} title="Update Teacher">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            name="teacher_department"
            value={formData.teacher_department}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateTeacherModal;