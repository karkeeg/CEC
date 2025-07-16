import React, { useState } from "react";
import { createNotice } from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";

const inputStyle = "border border-gray-300 rounded px-3 py-2 w-full";

// Helper to upload multiple files to Supabase Storage and return their public URLs
async function uploadFilesToStorage(files, folder = "notices") {
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

export const NoticeForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_global: true,
    to_all_teachers: false,
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrls = [];
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFilesToStorage(selectedFiles, "notices");
      }
      const { error } = await createNotice({ ...form, files: fileUrls });
      if (error) throw error;
      alert("Notice published!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to publish notice: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="title"
        placeholder="Notice Title*"
        className={inputStyle}
        value={form.title}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description*"
        rows={3}
        className={inputStyle}
        value={form.description}
        onChange={handleChange}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_global"
          checked={form.is_global}
          onChange={handleChange}
        />
        Global Notice
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="to_all_teachers"
          checked={form.to_all_teachers}
          onChange={handleChange}
        />
        To All Teachers
      </label>
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
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
};
