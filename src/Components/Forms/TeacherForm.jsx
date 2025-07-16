import React, { useState, useEffect } from "react";
import {
  createTeacher,
  getAllDepartments,
} from "../../supabaseConfig/supabaseApi";

const inputStyle = "border border-gray-300 rounded px-3 py-2 w-full";

export const TeacherForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "Rather not to say",
    email: "",
    phone: "",
    password: "",
    hashed_password: "",
    department_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDeptLoading(true);
      const depts = await getAllDepartments();
      setDepartments(depts || []);
      setDeptLoading(false);
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "password",
      "hashed_password",
      "department_id",
    ];
    if (required.some((f) => !form[f])) {
      alert("Please fill all required fields.");
      return;
    }

    if (form.password !== form.hashed_password) {
      alert("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await createTeacher(form);
      if (error) throw error;
      alert("Teacher added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to add teacher: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="first_name"
        placeholder="First Name*"
        className={inputStyle}
        value={form.first_name}
        onChange={handleChange}
      />
      <input
        name="last_name"
        placeholder="Last Name*"
        className={inputStyle}
        value={form.last_name}
        onChange={handleChange}
      />
      <select
        name="gender"
        placeholder="Gender"
        className={inputStyle}
        value={form.gender}
        onChange={handleChange}
      >
        <option>Select your Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <input
        name="email"
        type="email"
        placeholder="Email*"
        className={inputStyle}
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="phone"
        placeholder="Phone Number*"
        className={inputStyle}
        value={form.phone}
        onChange={handleChange}
      />
      <select
        name="department_id"
        className={inputStyle}
        value={form.department_id}
        onChange={handleChange}
        disabled={deptLoading}
      >
        <option value="">Select Department*</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
      <input
        name="password"
        type="password"
        placeholder="Password* (min 6 characters)"
        className={inputStyle}
        value={form.password}
        onChange={handleChange}
      />
      <input
        name="hashed_password"
        type="password"
        placeholder="Confirm Password*"
        className={inputStyle}
        value={form.hashed_password}
        onChange={handleChange}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Adding..." : "Save"}
        </button>
      </div>
    </form>
  );
};
