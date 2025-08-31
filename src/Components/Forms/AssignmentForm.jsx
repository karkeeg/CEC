import React, { useState, useEffect } from "react";
import {
  createAssignment,
  getAllClasses,
  getAllSubjects,
  getAllTeachers,
  logActivity,
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import Swal from 'sweetalert2';
import { fetchClasses } from './../../supabaseConfig/supabaseApi';

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

export const AssignmentForm = ({ onClose, onSuccess, currentUser }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject_id: "",
    due_date: "",
    teacher_id: currentUser?.id || "", // Set teacher_id from currentUser
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [currentTeacherName, setCurrentTeacherName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getAllSubjects();
        if (data) setSubjects(data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    const fetchClass = async () => {
      try {
        const data = await getAllClasses();
        if (data) setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    const fetchTeachers = async () => {
      try {
        const data = await getAllTeachers();
        if (data) {
          setTeachers(data);
          // Set current teacher's name if currentUser is available
          if (currentUser?.id) {
            const loggedInTeacher = data.find(t => t.id === currentUser.id);
            if (loggedInTeacher) {
              setCurrentTeacherName(`${loggedInTeacher.first_name} ${loggedInTeacher.last_name}`);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };
    fetchSubjects();
    fetchTeachers();
    fetchClass();
  }, [currentUser]);

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
      "year",
    ];
    // teacher_id is automatically set from currentUser, so it's not required in the form check
    if (!form.teacher_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Teacher information is missing. Please log in again.',
        customClass: {
          popup: 'swal-small'
        }
      });
      return;
    }
    if (required.some((f) => !form[f])) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill all required fields.',
        customClass: {
          popup: 'swal-small'
        }
      });
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
      await logActivity(
        `Assignment "${form.title}" created.`,
        "assignment",
        currentUser || {}
      );
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Assignment added successfully!',
        customClass: {
          popup: 'swal-small'
        }
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to add assignment: ' + error.message,
        customClass: {
          popup: 'swal-small'
        }
      });
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
      <div className="flex flex-col md:flex-row gap-2">

      
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
      <select
        name="class_id"
        className={inputStyle}
        value={form.class_id}
        onChange={handleChange}
      >
        <option value="">Select Classes*</option>
        {classes.map((c) => (
          <option key={c.class_id} value={c.class_id}>
            {c.name}
          </option>
        ))}
      </select>
      </div>
      <input
        name="due_date"
        type="datetime-local"
        className={inputStyle}
        value={form.due_date}
        onChange={handleChange}
      />
      {currentUser?.role === 'teacher' ? (
        <input
          name="teacher_id"
          className={inputStyle}
          value={currentTeacherName || "Loading Teacher..."}
          disabled // Disable the input
        />
      ) : (
        <select
          name="teacher_id"
          className={inputStyle}
          value={form.teacher_id}
          onChange={handleChange}


          
        >
          {/* if user is teacher, show their name and disable the input */}
      
          <option value="">Select Teacher*</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.first_name} {t.last_name}
            </option>
          ))}
        </select>
      )}
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
