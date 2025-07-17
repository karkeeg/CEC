import React, { useState } from "react";
import { createStudent } from "../../supabaseConfig/supabaseApi";

const inputStyle = "border border-gray-300 rounded px-3 py-2 w-full";

export const StudentForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    address: "",
    gender: "Male",
    year: "",
    reg_no: "",
    email: "",
    hashed_password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "first_name",
      "last_name",
      "date_of_birth",
      "address",
      "year",
      "reg_no",
      "email",
      "hashed_password",
    ];
    if (required.some((field) => !form[field])) {
      alert("Please fill all required fields.");
      return;
    }
    if (form.hashed_password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (form.hashed_password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await createStudent(form);
      if (error) throw error;
      alert("Student added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to add student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <input
        name="first_name"
        placeholder="First Name*"
        className={inputStyle}
        value={form.first_name}
        onChange={handleChange}
      />
      <input
        name="middle_name"
        placeholder="Middle Name"
        className={inputStyle}
        value={form.middle_name}
        onChange={handleChange}
      />
      <input
        name="last_name"
        placeholder="Last Name*"
        className={inputStyle}
        value={form.last_name}
        onChange={handleChange}
      />
      <input
        type="date"
        name="date_of_birth"
        className={inputStyle}
        value={form.date_of_birth}
        onChange={handleChange}
      />
      <input
        name="address"
        placeholder="Address*"
        className={inputStyle}
        value={form.address}
        onChange={handleChange}
      />
      <select
        name="gender"
        className={inputStyle}
        value={form.gender}
        onChange={handleChange}
      >
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      {/* Change year input to a select dropdown */}
      <select
        name="year"
        className={inputStyle}
        value={form.year}
        onChange={handleChange}
        required
      >
        <option value="">Select Year*</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <input
        name="reg_no"
        placeholder="Registration No*"
        className={inputStyle}
        value={form.reg_no}
        onChange={handleChange}
      />
      <input
        name="email"
        type="email"
        placeholder="Email*"
        className={inputStyle}
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="hashed_password"
        type="password"
        placeholder="Password* (min 6 characters)"
        className={inputStyle}
        value={form.hashed_password}
        onChange={handleChange}
      />
      <input
        name="confirm_password"
        type="password"
        placeholder="Confirm Password*"
        className={inputStyle}
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
      />
      <div className="md:col-span-2 flex justify-end gap-2 mt-4">
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
