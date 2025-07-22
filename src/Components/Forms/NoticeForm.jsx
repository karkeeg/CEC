import React, { useState } from "react";
import { createNotice } from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import { FaUpload, FaTrash, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from "react-icons/fa";

const inputStyle = "border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
const errorStyle = "border-red-500 focus:ring-red-500";

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
    priority: "normal",
    expiry_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters long";
    }
    
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters long";
    }
    
    if (form.expiry_date && new Date(form.expiry_date) <= new Date()) {
      newErrors.expiry_date = "Expiry date must be in the future";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'medium':
        return <FaInfoCircle className="text-yellow-500" />;
      default:
        return <FaCheckCircle className="text-green-500" />;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      let fileUrls = [];
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFilesToStorage(selectedFiles, "notices");
      }
      const { error } = await createNotice({ ...form, files: fileUrls });
      if (error) throw error;
      alert("Notice published successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to publish notice: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notice Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            placeholder="Enter notice title..."
            className={`${inputStyle} ${errors.title ? errorStyle : ""}`}
            value={form.title}
            onChange={handleChange}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            placeholder="Enter detailed description..."
            rows={4}
            className={`${inputStyle} ${errors.description ? errorStyle : ""} resize-none`}
            value={form.description}
            onChange={handleChange}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          <p className="text-gray-500 text-sm mt-1">{form.description.length} characters</p>
        </div>

        {/* Priority Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            {getPriorityIcon(form.priority)}
            <span>
              {form.priority === 'high' && 'High priority notices appear at the top'}
              {form.priority === 'medium' && 'Medium priority notices are highlighted'}
              {form.priority === 'normal' && 'Standard priority notice'}
            </span>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date (Optional)
          </label>
          <input
            type="datetime-local"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            className={`${inputStyle} ${errors.expiry_date ? errorStyle : ""}`}
            min={new Date().toISOString().slice(0, 16)}
          />
          {errors.expiry_date && <p className="text-red-500 text-sm mt-1">{errors.expiry_date}</p>}
          <p className="text-gray-500 text-sm mt-1">Notice will be automatically hidden after this date</p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name="is_global"
              checked={form.is_global}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-700">Global Notice</span>
              <p className="text-sm text-gray-500">Visible to all students and teachers</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name="to_all_teachers"
              checked={form.to_all_teachers}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-700">Send to All Teachers</span>
              <p className="text-sm text-gray-500">Send notification email to all teachers</p>
            </div>
          </label>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FaUpload className="mx-auto text-gray-400 text-2xl mb-2" />
            <p className="text-gray-600 mb-2">Drag and drop files here, or</p>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
              Choose Files
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supported: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF (Max 10MB each)
            </p>
          </div>

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-700">Selected Files:</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-medium">
                        {file.name.split('.').pop().toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 truncate max-w-xs">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Publishing...
              </>
            ) : (
              "Publish Notice"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
