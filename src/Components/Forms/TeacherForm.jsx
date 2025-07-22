import React, { useState, useEffect } from "react";
import {
  createTeacher,
  getAllDepartments,
  logActivity,
} from "../../supabaseConfig/supabaseApi";

const inputStyle = "border border-gray-300 rounded px-3 py-2 w-full";

export const TeacherForm = ({ onClose, onSuccess, currentUser }) => {
  const [form, setForm] = useState({
    id: "",
    email: "",
    hashed_password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    phone: "",
    password: "",
    teacher_department: "",
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
      "teacher_department",
    ];
    if (
      required.some(
        (f) =>
          !form[f] || (f === "teacher_department" && !form.teacher_department)
      )
    ) {
      alert("Please fill all required fields, including department.");
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

    // Prepare teacher data, only include teacher_department if selected
    const teacherData = {
      email: form.email,
      hashed_password: form.hashed_password,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      gender: form.gender,
      phone: form.phone,
      teacher_department: form.teacher_department,
    };
    // if (form.teacher_department && form.teacher_department !== "") {
    //   teacherData.teacher_department = form.teacher_department;
    // }
    // Debug: Show what is being sent for teacher_department
    console.log(
      "Submitting teacher_department (should be UUID):",
      form.teacher_department
    );

    try {
      const { data, error } = await createTeacher(teacherData);
      if (error) throw error;
      await logActivity(
        `Teacher "${form.first_name} ${form.last_name}" registered.`,
        "teacher",
        currentUser || {}
      );
      alert("Teacher added successfully!");
      const teacherName = `${form.first_name} ${form.last_name}`;
      const teacherEmail = form.email;
      if (onSuccess) {
        onSuccess({ name: teacherName, email: teacherEmail });
      }
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
        <option value="">Select your Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
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
      {/* Department Dropdown */}
      <div className="col-span-2">
        <label className="block font-semibold mb-1">Department*</label>
        <select
          name="teacher_department"
          className={inputStyle}
          value={form.teacher_department}
          onChange={handleChange}
          required
          disabled={deptLoading}
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
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
