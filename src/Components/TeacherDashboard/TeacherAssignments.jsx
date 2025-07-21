import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  getAssignmentsByTeacher,
  getClassesByTeacher,
  getSubjects,
  createAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  updateAssignment,
} from "../../supabaseConfig/supabaseApi";
import { AssignmentForm } from "../Forms/AssignmentForm";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaUsers,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

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
  const [submissionProgress, setSubmissionProgress] = useState([]); // For StepLine chart
  const [viewAssignment, setViewAssignment] = useState(null);
  const [editAssignment, setEditAssignment] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        // Fetch all subjects (no department filter)
        const subjectData = await getSubjects();
        setSubjects(subjectData || []);
        // Fetch assignments
        const assignmentData = await getAssignmentsByTeacher(user.id);
        let filtered = assignmentData || [];
        if (role === "teacher") {
          filtered = filtered.filter(
            (a) => a.teacher_id === user.id || a.teacher_id === user.username
          );
        }
        setAssignments(filtered);
        // Fetch classes directly from classes table
        const classes = await getClassesByTeacher(user.id);
        setClasses(classes || []);
        // Fetch submission progress for StepLine chart
        const submissions = await getAssignmentSubmissions();
        // Calculate submission rate per assignment/class
        const progress = (assignmentData || []).map((a) => {
          const classStudents =
            classes.find((c) => c.id === a.class_id)?.studentCount || 0;
          const submitted = (submissions || []).filter(
            (s) => s.assignment_id === a.id
          ).length;
          return {
            name: a.title,
            submissionRate: classStudents
              ? Math.round((submitted / classStudents) * 100)
              : 0,
          };
        });
        setSubmissionProgress(progress);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, role]);

  console.log("Assignments in table:", assignments);

  const filteredAssignments = assignments.filter(
    (assignment) =>
      selectedClass === "all" ||
      assignment.class?.id === selectedClass ||
      assignment.class_id === selectedClass
  );

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
      let filtered = assignmentData || [];
      if (role === "teacher") {
        filtered = filtered.filter(
          (a) => a.teacher_id === user.id || a.teacher_id === user.username
        );
      }
      setAssignments(filtered);
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
    const error = await updateAssignment(editAssignment.id, {
      ...editForm,
      files: editForm.files,
    });
    if (!error) {
      // Refresh assignments
      const assignmentData = await getAssignmentsByTeacher(user.id);
      let filtered = assignmentData || [];
      if (role === "teacher") {
        filtered = filtered.filter(
          (a) => a.teacher_id === user.id || a.teacher_id === user.username
        );
      }
      setAssignments(filtered);
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
    let filtered = assignmentData || [];
    if (role === "teacher") {
      filtered = filtered.filter(
        (a) => a.teacher_id === user.id || a.teacher_id === user.username
      );
    }
    setAssignments(filtered);
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Summary Section: Filters and Create Button */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Assignments
            </h1>
            <p className="text-gray-600">
              Create and manage assignments for your classes
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
        {/* Filter */}
        <div className="bg-blue-100 p-4 rounded-xl shadow mt-2 mb-6">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List Section */}
      <div className="bg-blue-100 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
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
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          {dueDate.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.total_points} pts
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewAssignment(assignment)}
                          >
                            <FaEye className="text-lg" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <FaEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAssignment(assignment.id)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash className="text-lg" />
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
      </div>
      {/* Charts Section: Assignment Submission Progress */}
      <div className="my-8">
        {/* Assignment Submission Progress Ladder Chart */}
        <div className="bg-blue-100 p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Assignment Submission Progress (Ladder Chart)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={submissionProgress}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="submissionRate"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-2">Create New Assignment</h2>
            <AssignmentForm
              onClose={() => setShowCreateModal(false)}
              onSuccess={handleAssignmentCreated}
            />
          </div>
        </div>
      )}
      {viewAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-2">Assignment Details</h2>
            <p>
              <strong>Title:</strong> {viewAssignment.title}
            </p>
            <p>
              <strong>Description:</strong> {viewAssignment.description}
            </p>
            <p>
              <strong>Due Date:</strong>{" "}
              {new Date(viewAssignment.due_date).toLocaleString()}
            </p>
            <p>
              <strong>Year:</strong> {viewAssignment.year}
            </p>
            <p>
              <strong>Class:</strong> {viewAssignment.class?.name}
            </p>
            <button
              className="mt-4 bg-gray-300 px-4 py-2 rounded"
              onClick={() => setViewAssignment(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {editAssignment && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-3 w-full max-w-2xl shadow-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-1 text-gray-800">
              Edit Assignment: {editAssignment.title}
            </h2>
            <form
              onSubmit={handleEditFormSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 space-y-0"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  name="subject_id"
                  value={editForm.subject_id}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                >
                  <option value="">Select Subject</option>
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
                <select
                  name="class_id"
                  value={editForm.class_id}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                >
                  <option value="">Select Class</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  name="year"
                  value={editForm.year}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm"
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
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm min-h-[60px]"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleEditFilesChange}
                  className="w-full border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-200 text-sm"
                />
                {Array.isArray(editForm.files) && editForm.files.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {editForm.files.map((file, idx) => (
                      <li key={idx}>
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          File {idx + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end mt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded shadow-sm hover:bg-blue-700 text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-gray-200 px-4 py-1.5 rounded shadow-sm hover:bg-gray-300 text-sm"
                  onClick={() => setEditAssignment(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
