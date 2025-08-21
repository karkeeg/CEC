import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import {
  createNotice,
  updateNotice,
  deleteNotice,
  logActivity,
} from "../../supabaseConfig/supabaseApi";
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

export const NoticeForm = ({
  onClose,
  onSuccess,
  notice,
  onDelete,
  currentUser,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_global: true,
    to_all_teachers: false,
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (notice) {
      setForm({
        title: notice.title || "",
        description: notice.description || "",
        is_global: notice.is_global ?? true,
        to_all_teachers: notice.to_all_teachers ?? false,
        files: notice.files || [],
      });
    }
  }, [notice]);

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
      let fileUrls = form.files || [];
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFilesToStorage(selectedFiles, "notices");
      }
      if (notice) {
        // Edit mode
        const { error } = await updateNotice(notice.notice_id, {
          ...form,
          files: fileUrls,
        });
        if (error) throw error;
        await logActivity(
          `Notice "${form.title}" updated.`,
          "notice",
          currentUser || {}
        );
        Swal.fire({
          icon: 'success',
          title: 'Notice Updated!',
          text: 'Notice has been successfully updated.',
          customClass: { container: 'swal-small' }
        });
      } else {
        // Add mode
        const { error } = await createNotice({ ...form, files: fileUrls });
        if (error) throw error;
        await logActivity(
          `Notice "${form.title}" published.`,
          "notice",
          currentUser || {}
        );
        Swal.fire({
          icon: 'success',
          title: 'Notice Published!',
          text: 'Notice has been successfully published.',
          customClass: { container: 'swal-small' }
        });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: notice ? 'Update Failed' : 'Publish Failed',
        text: (notice ? "Failed to update notice: " : "Failed to publish notice: ") + error.message,
        customClass: { container: 'swal-small' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!notice) return;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      customClass: { container: 'swal-small' }
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      const { error } = await deleteNotice(notice.notice_id);
      if (error) throw error;
      await logActivity(
        `Notice "${notice.title}" deleted.`,
        "notice",
        currentUser || {}
      );
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Notice has been deleted.',
        customClass: { container: 'swal-small' }
      });
      if (onDelete) onDelete();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete notice: ' + error.message,
        customClass: { container: 'swal-small' }
      });
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
      {form.files && form.files.length > 0 && (
        <div className="text-xs text-gray-600">
          Existing files:{" "}
          {form.files.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline mr-2"
            >
              File {i + 1}
            </a>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        {notice && (
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading
            ? notice
              ? "Updating..."
              : "Publishing..."
            : notice
            ? "Update"
            : "Publish"}
        </button>
      </div>
    </form>
  );
};
