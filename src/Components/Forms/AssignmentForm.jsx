import React, { useState, useEffect } from "react";
import {
  createAssignment,
  getAllSubjects,
  getAllTeachers,
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";

const inputStyle = "border border-gray-300 rounded px-3 py-2 w-full";

// Helper to upload multiple files to Supabase Storage and return their public URLs
async function uploadFilesToStorage(files, folder = "assignments") {
  const bucket = "public-files";
  const urls = [];
  for (const file of files) {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    if (error) throw error;
    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

export const AssignmentForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject_id: "",
    due_date: "",
    teacher_id: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const data = await getAllSubjects();
      if (data) setSubjects(data);
    };
    const fetchTeachers = async () => {
      const data = await getAllTeachers();
      if (data) setTeachers(data);
    };
    fetchSubjects();
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "title",
      "description",
      "subject_id",
      "due_date",
      "teacher_id",
      "year",
    ];
    if (required.some((f) => !form[f])) {
      alert("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      let fileUrls = [];
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFilesToStorage(selectedFiles, "assignments");
      }
      const { error } = await createAssignment({ ...form, files: fileUrls });
      if (error) throw error;
      alert("Assignment added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to add assignment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="title"
        placeholder="Title*"
        className={inputStyle}
        value={form.title}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description*"
        className={inputStyle}
        value={form.description}
        onChange={handleChange}
        rows={3}
      />
      <select
        name="subject_id"
        className={inputStyle}
        value={form.subject_id}
        onChange={handleChange}
      >
        <option value="">Select Subject*</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        name="due_date"
        type="datetime-local"
        className={inputStyle}
        value={form.due_date}
        onChange={handleChange}
      />
      <select
        name="teacher_id"
        className={inputStyle}
        value={form.teacher_id}
        onChange={handleChange}
      >
        <option value="">Select Teacher*</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.first_name} {t.last_name}
          </option>
        ))}
      </select>
      <select
        name="year"
        className={inputStyle}
        value={form.year}
        onChange={handleChange}
      >
        <option value="">Select Year*</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className={inputStyle}
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
