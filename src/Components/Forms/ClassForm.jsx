import React, { useState, useEffect } from "react";
import {
  createClass,
  fetchDepartments,
  fetchSubjects,
  fetchRooms,
  logActivity,
} from "../../supabaseConfig/supabaseApi";

const ClassForm = ({ user, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    department_id: "",
    teacher_id: user.id,
    subject_id: "",
    room_no: "",
    schedule: "",
    capacity: "",
    year: "",
    semester: "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDepartments().then(setDepartments);
    fetchSubjects().then(setSubjects);
    fetchRooms().then(setRooms);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    // Debug: log the form and teacher_id
    console.log("Current user:", user);
    console.log("Submitting class with teacher_id:", form.teacher_id);
    try {
      const { error } = await createClass(form);
      if (error) {
        setError(
          error.message || "Failed to register class. Please try again."
        );
      } else {
        await logActivity(
          `Class "${form.name}" registered.`,
          "class",
          user || {}
        );
        setMessage("Class registered successfully!");
        setForm({
          name: "",
          description: "",
          department_id: "",
          teacher_id: user.id,
          subject_id: "",
          room_no: "",
          schedule: "",
          capacity: "",
          year: "",
          semester: "",
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || "Failed to register class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[600px]  ">
      {message && (
        <div className="text-green-600 text-center font-semibold mb-2">
          {message}
        </div>
      )}
      {error && (
        <div className="text-red-600 text-center font-semibold mb-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Class Name"
          value={form.name}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
        />
        <select
          name="subject_id"
          value={form.subject_id}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="department_id"
          value={form.department_id}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          name="teacher_id"
          placeholder="Teacher ID"
          value={form.teacher_id}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full bg-gray-100"
          disabled
        />
        {/* Room Dropdown */}
        <select
          name="room_no"
          value={form.room_no}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">Select Room</option>
          {rooms.map((r) => (
            <option key={r.room_no} value={r.room_no}>
              {r.name} ({r.room_no})
            </option>
          ))}
        </select>
        <input
          name="schedule"
          type="datetime-local"
          value={form.schedule}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          name="capacity"
          type="number"
          placeholder="Capacity"
          value={form.capacity}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
        />
        <input
          name="year"
          type="number"
          placeholder="Year"
          value={form.year}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
        />
        <input
          name="semester"
          type="number"
          placeholder="Semester"
          value={form.semester}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-semibold transition-colors"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Class"}
        </button>
        <button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded shadow font-semibold"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
