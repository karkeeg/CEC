import React, { useState, useEffect } from "react";
import Modal from "../Modal";

const DepartmentForm = ({
  mode = "add",
  initialValues = {},
  faculties = [],
  onSubmit,
  onClose,
}) => {
  const [name, setName] = useState(initialValues.name || "");
  const [faculty, setFaculty] = useState(initialValues.faculty_id || "");
  const [facultyName, setFacultyName] = useState(
    initialValues.facultyName || ""
  );
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(
    mode === "add"
  );
  const [description, setDescription] = useState(
    initialValues.description || ""
  );
  const [courses, setCourses] = useState(initialValues.courses || "");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(initialValues.image_url || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialValues.name || "");
    setFaculty(initialValues.faculty_id || "");
    setFacultyName(initialValues.facultyName || "");
    setShowFacultyDropdown(mode === "add");
    setDescription(initialValues.description || "");
    setCourses(initialValues.courses || "");
    setImage(null);
    setImageUrl(initialValues.image_url || "");
  }, [initialValues, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      name,
      faculty_id: faculty,
      description,
      courses,
      image,
      image_url: imageUrl,
    });
    setSubmitting(false);
  };

  return (
    <Modal
      title={mode === "add" ? "Add New Department" : "Update Department"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Department Name*"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {/* Faculty selection logic */}
        {mode === "edit" && !showFacultyDropdown ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Faculty:</span>
            <span className="text-gray-700">
              {facultyName ||
                faculties.find((f) => f.id === faculty)?.name ||
                "Unknown"}
            </span>
            <button
              type="button"
              className="ml-2 text-blue-600 underline text-sm"
              onClick={() => setShowFacultyDropdown(true)}
            >
              Update Faculty
            </button>
          </div>
        ) : (
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            required
          >
            <option value="">Select Faculty*</option>
            {faculties.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>
        )}
        <textarea
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          className="border border-gray-300 rounded px-3 py-2 w-full font-mono"
          placeholder='Courses (JSON, e.g. {"Year 1": ["Subject 1"]})'
          value={courses}
          onChange={(e) => setCourses(e.target.value)}
          rows={2}
          required
        />
        <label className="font-semibold">
          Add an image related to this department
        </label>
        {/* Previous image preview with delete */}
        {imageUrl && !image ? (
          <div className="relative inline-block mb-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-7 h-8 object-cover rounded shadow"
            />
            <button
              type="button"
              aria-label="Delete image"
              className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-100 z-10"
              onClick={() => setImageUrl("")}
            >
              <span className="text-xs text-red-600">✕</span>
            </button>
          </div>
        ) : !image && !imageUrl ? (
          <div className="w-7 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-2">
            No image
          </div>
        ) : null}
        <input
          type="file"
          accept="image/*"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          onChange={(e) => setImage(e.target.files[0])}
        />
        {image && (
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="w-full h-40 object-contain rounded"
          />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={submitting}
          >
            {submitting
              ? mode === "add"
                ? "Adding..."
                : "Updating..."
              : mode === "add"
              ? "Add Department"
              : "Update Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentForm;
