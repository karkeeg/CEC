import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getAssignmentsByTeacher,
  getClassesByTeacher,
  getSubjects,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../../supabaseConfig/supabaseApi";
import { AssignmentForm } from "../Forms/AssignmentForm";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCalendarAlt,
} from "react-icons/fa";
 
import Modal from "../Modal";
import Loader from "../Loader";

// Cache keys for localStorage
const CACHE_KEYS = {
  ASSIGNMENTS: 'teacher_assignments_cache',
  CLASSES: 'teacher_assignments_classes_cache',
  SUBJECTS: 'teacher_assignments_subjects_cache',
  CACHE_TIMESTAMP: 'teacher_assignments_timestamp'
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const TeacherAssignments = () => {
  const { user, role } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("all");
  const [subjects, setSubjects] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    subject_id: "",
    due_date: "",
    year: "",
    class_id: "", // add this
  });

  // Check if cached data is still valid
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  };

  // Load data from cache
  const loadFromCache = () => {
    try {
      const cachedAssignments = localStorage.getItem(CACHE_KEYS.ASSIGNMENTS);
      const cachedClasses = localStorage.getItem(CACHE_KEYS.CLASSES);
      const cachedSubjects = localStorage.getItem(CACHE_KEYS.SUBJECTS);
      
      if (cachedAssignments && cachedClasses && cachedSubjects) {
        const assignmentsData = JSON.parse(cachedAssignments);
        const classesData = JSON.parse(cachedClasses);
        const subjectsData = JSON.parse(cachedSubjects);
        
        setAssignments(assignmentsData);
        setClasses(classesData);
        setSubjects(subjectsData);
        
        return true;
      }
    } catch (error) {
      console.error("Error loading assignments cache:", error);
    }
    return false;
  };

  // Save data to cache
  const saveToCache = (assignmentsData, classesData, subjectsData) => {
    try {
      localStorage.setItem(CACHE_KEYS.ASSIGNMENTS, JSON.stringify(assignmentsData));
      localStorage.setItem(CACHE_KEYS.CLASSES, JSON.stringify(classesData));
      localStorage.setItem(CACHE_KEYS.SUBJECTS, JSON.stringify(subjectsData));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error("Error saving assignments cache:", error);
    }
  };
  
  const [viewAssignment, setViewAssignment] = useState(null);
  const [editAssignment, setEditAssignment] = useState(null);
  const [editForm, setEditForm] = useState(null);
  

  useEffect(() => {
    if (!user?.id) return;

    // Try to load from cache first
    if (isCacheValid() && loadFromCache()) {
      setLoading(false);
      return;
    }

    // If no valid cache, fetch fresh data
    const fetchData = async () => {
      setLoading(true);
      try {
        const [assignmentsData, classesData, subjectsData] = await Promise.all([
          getAssignmentsByTeacher(user.id),
          getClassesByTeacher(user.id),
          getSubjects(),
        ]);
        
        setAssignments(assignmentsData || []);
        setClasses(classesData || []);
        setSubjects(subjectsData || []);
        
        // Save to cache
        saveToCache(assignmentsData || [], classesData || [], subjectsData || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);
 

  console.log("Assignments in table:", assignments);

  // Robust filtering: always compare as strings
  const filteredAssignments =
    selectedClass === "all"
      ? assignments
      : assignments.filter((a) => String(a.class_id) === String(selectedClass));

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const required = [
        "title",
        "description",
        "subject_id",
        "due_date",
        "year",
        "class_id", // now required
      ];
      if (required.some((f) => !newAssignment[f])) {
        alert("Please fill all required fields.");
        return;
      }
      const error = await createAssignment({
        ...newAssignment,
        teacher_id: user.id,
      });
      if (error) throw error;
      // Refresh assignments
      const assignmentData = await getAssignmentsByTeacher(user.id);
      setAssignments(assignmentData || []);
      setShowCreateModal(false);
      setNewAssignment({
        title: "",
        description: "",
        subject_id: "",
        due_date: "",
        year: "",
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      const error = await deleteAssignment(assignmentId);
      if (error) throw error;
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
  };

  const handleViewAssignment = (assignment) => setViewAssignment(assignment);
  const handleEditAssignment = (assignment) => {
    setEditAssignment(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description,
      subject_id: assignment.subject_id,
      due_date: assignment.due_date,
      year: assignment.year,
      class_id: assignment.class_id,
      files: Array.isArray(assignment.files)
        ? assignment.files
        : assignment.files
        ? [assignment.files]
        : [],
    });
  };

  // Helper function to get current subject name
  const getCurrentSubjectName = (assignment) => {
    if (assignment.subject && assignment.subject.name) {
      return assignment.subject.name;
    }
    // Fallback: find subject name from subjects array
    const subject = subjects.find((s) => s.id === assignment.subject_id);
    return subject ? subject.name : "Unknown Subject";
  };

  // Helper function to get current class name
  const getCurrentClassName = (assignment) => {
    const classItem = classes.find(
      (c) => c.id === assignment.class_id || c.class_id === assignment.class_id
    );
    return classItem ? classItem.name : "Unknown Class";
  };
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const uploadedUrls = [];
    for (const file of files) {
      const filePath = `assignments/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("public-files")
        .upload(filePath, file);
      if (!uploadError) {
        const { data } = supabase.storage
          .from("public-files")
          .getPublicUrl(filePath);
        if (data && data.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      } else {
        alert(`Failed to upload file: ${file.name}`);
      }
    }
    setEditForm((prev) => ({
      ...prev,
      files: [...(prev.files || []), ...uploadedUrls],
    }));
  };
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!editAssignment) return;

    // Use existing values if not changed
    const updateData = {
      ...editForm,
      subject_id: editForm.subject_id || editAssignment.subject_id,
      class_id: editForm.class_id || editAssignment.class_id,
      files: editForm.files,
    };

    const error = await updateAssignment(editAssignment.id, updateData);
    if (!error) {
      // Refresh assignments
      const assignmentData = await getAssignmentsByTeacher(user.id);
      setAssignments(assignmentData || []);
      setEditAssignment(null);
      setEditForm(null);
      alert("Assignment updated!");
    } else {
      alert("Failed to update assignment.");
    }
  };

  const handleAssignmentCreated = async () => {
    setShowCreateModal(false);
    const assignmentData = await getAssignmentsByTeacher(user.id);
    setAssignments(assignmentData || []);
  };

  const getStatusColor = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "bg-red-100 text-red-800";
    if (diffDays <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading assignments data..." />
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-w-0">
      {/* Summary Section: Filters and Create Button */}
      <div className="mb-8 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 min-w-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Assignments
            </h1>
            <p className="text-gray-600">
              Create and manage assignments for your classes. Only assignments
              from your assigned classes are shown.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
          >
            <FaPlus />
            <span>Create Assignment</span>
          </button>
        </div>
        {/* Positive Message and Filter */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mt-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">
              Filter by Class:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option
                  key={cls.id || cls.class_id}
                  value={cls.id || cls.class_id}
                >
                  {cls.name} ({cls.department})
                </option>
              ))}
            </select>
          </div>
          <span className="text-green-800 font-semibold text-right">
            To see who submitted the assignment and grade them, go to the grades
            section.
          </span>
        </div>
      </div>

      {/* Assignments List Section */}
      <div className="bg-blue-100 rounded-xl shadow overflow-hidden min-w-0 max-w-[1400px] mx-auto">
        <div className="overflow-x-auto min-w-0">
          <div className="h-[500px] overflow-y-auto">
            <table className="min-w-[1100px] divide-y divide-gray-200 text-sm md:text-base">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No assignments found
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((assignment, index) => {
                    const statusColor = getStatusColor(assignment.due_date);
                    const dueDate = new Date(assignment.due_date);
                    const today = new Date();
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let statusText = "Upcoming";
                    if (diffDays < 0) statusText = "Overdue";
                    else if (diffDays <= 3) statusText = "Due Soon";

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 ${
                          index >= 8 ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.description?.substring(0, 40)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {getCurrentSubjectName(assignment)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {(() => {
                              const cls = classes.find(
                                (c) =>
                                  c.id === assignment.class_id ||
                                  c.class_id === assignment.class_id
                              );
                              return cls ? cls.name : assignment.class_id;
                            })()}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400" />
                            {dueDate.toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}
                          >
                            {statusText}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium w-40">
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                              onClick={() => handleViewAssignment(assignment)}
                            >
                              <FaEye className="text-base" />
                            </button>
                            <button
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                              onClick={() => handleEditAssignment(assignment)}
                            >
                              <FaEdit className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              <FaTrash className="text-base" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            let files = assignment.files;
                            if (typeof files === "string") {
                              try {
                                files = JSON.parse(files);
                              } catch {
                                files = files ? [files] : [];
                              }
                            }
                            if (!Array.isArray(files))
                              files = files ? [files] : [];
                            return files.length > 0 ? (
                              <ul>
                                {files.map((file, idx) => (
                                  <li key={idx}>
                                    <a
                                      href={file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      File {idx + 1}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-400">No files</span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Scroll indicator */}
          {filteredAssignments.length > 8 && (
            <div className="text-center py-2 text-sm text-gray-500 bg-gray-100">
              Showing {Math.min(8, filteredAssignments.length)} of{" "}
              {filteredAssignments.length} assignments - Scroll down to see more
            </div>
          )}
        </div>
      </div>

      

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <Modal
          title="Create New Assignment"
          onClose={() => setShowCreateModal(false)}
        >
          <AssignmentForm
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleAssignmentCreated}
          />
        </Modal>
      )}
      {viewAssignment && (
        <Modal
          title="Assignment Details"
          onClose={() => setViewAssignment(null)}
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div className="bg-blue-50 p-2 rounded-lg">
              <strong className="text-gray-700 text-xs">Title:</strong>
              <p className="mt-1 text-gray-900 font-medium text-sm">
                {viewAssignment.title}
              </p>
            </div>

            {/* Description */}
            <div>
              <strong className="text-gray-700 text-sm">Description:</strong>
              <p className="mt-1 text-gray-900 text-sm leading-relaxed">
                {viewAssignment.description}
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <strong className="text-gray-700 text-xs">Subject:</strong>
                <p className="mt-1 text-gray-900 font-medium text-sm">
                  {getCurrentSubjectName(viewAssignment)}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <strong className="text-gray-700 text-xs">Class:</strong>
                <p className="mt-1 text-gray-900 font-medium text-sm">
                  {getCurrentClassName(viewAssignment)}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <strong className="text-gray-700 text-xs">Year:</strong>
                <p className="mt-1 text-gray-900 font-medium text-sm">
                  {viewAssignment.year}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <strong className="text-gray-700 text-xs">Due Date:</strong>
                <p className="mt-1 text-gray-900 font-medium text-sm">
                  {new Date(viewAssignment.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Files */}
            {viewAssignment.files &&
              Array.isArray(viewAssignment.files) &&
              viewAssignment.files.length > 0 && (
                <div className="bg-green-50 p-2 rounded-lg">
                  <strong className="text-gray-700 text-xs">Files:</strong>
                  <ul className="mt-1 space-y-1">
                    {viewAssignment.files.map((file, idx) => (
                      <li key={idx}>
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 underline hover:text-blue-800 text-sm"
                        >
                          📎 File {idx + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </Modal>
      )}
      {editAssignment && editForm && (
        <Modal
          title={`Edit Assignment: ${editAssignment.title}`}
          onClose={() => setEditAssignment(null)}
        >
          <form
            onSubmit={handleEditFormSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-2 space-y-0 max-h-[70vh] overflow-y-auto"
          >
            {/* Title - Full Width */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                name="title"
                value={editForm.title}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 px-2 py-1.5 rounded-md focus:ring-2 focus:ring-blue-200 text-sm"
                required
              />
            </div>

            {/* Subject and Class - Side by Side */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <div className="mb-1">
                <span className="text-xs text-gray-500">
                  Current:{" "}
                  <span className="font-medium text-blue-600">
                    {editAssignment
                      ? getCurrentSubjectName(editAssignment)
                      : "Loading..."}
                  </span>
                </span>
              </div>
              <select
                name="subject_id"
                value={editForm.subject_id}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="">Keep Current Subject</option>
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <div className="mb-1">
                <span className="text-xs text-gray-500">
                  Current:{" "}
                  <span className="font-medium text-blue-600">
                    {editAssignment
                      ? getCurrentClassName(editAssignment)
                      : "Loading..."}
                  </span>
                </span>
              </div>
              <select
                name="class_id"
                value={editForm.class_id}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="">Keep Current Class</option>
                {classes.map((cls) => (
                  <option
                    key={cls.id || cls.class_id}
                    value={cls.id || cls.class_id}
                  >
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year and Due Date - Side by Side */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                name="year"
                value={editForm.year}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-200 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                name="due_date"
                type="date"
                value={editForm.due_date?.slice(0, 10) || ""}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-200 text-sm"
                required
              />
            </div>
            {/* Description - Full Width */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-200 text-sm min-h-[80px] resize-none"
                required
              />
            </div>

            {/* Files - Full Width */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleEditFilesChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-200 text-sm"
              />
              {Array.isArray(editForm.files) && editForm.files.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Current files:</p>
                  <ul className="space-y-1">
                    {editForm.files.map((file, idx) => (
                      <li key={idx}>
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                          📎 File {idx + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Buttons - Full Width */}
            <div className="lg:col-span-2 flex gap-3 justify-end mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-300 text-sm font-medium transition-colors"
                onClick={() => setEditAssignment(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TeacherAssignments;
