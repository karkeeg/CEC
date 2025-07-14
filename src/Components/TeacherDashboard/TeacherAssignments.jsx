import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
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
  const { user } = useUser();
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        // Fetch all subjects (no department filter)
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("id, name");
        if (subjectError) throw subjectError;
        setSubjects(subjectData || []);
        // Fetch assignments (unchanged)
        const { data: assignmentData, error: assignmentsError } = await supabase
          .from("assignments")
          .select(
            `
            id,
            title,
            description,
            due_date,
            created_at,
            subject:subject_id (
              id,
              name
            ),
            year,
            class_id
          `
          );
        if (assignmentsError) throw assignmentsError;
        setAssignments(assignmentData || []);
        // Fetch classes directly from classes table
        const { data: classes, error: classesError } = await supabase
          .from("classes")
          .select("*")
          .eq("teacher_id", user.id);
        if (classesError) throw classesError;
        setClasses(classes || []);
        // Fetch submission progress for StepLine chart
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("assignment_id, class_id, student_id");
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
  }, [user]);

  const filteredAssignments = assignments.filter(
    (assignment) =>
      selectedClass === "all" || assignment.class?.id === selectedClass
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
      const { error } = await supabase.from("assignments").insert([
        {
          id: String(Date.now()),
          title: newAssignment.title,
          description: newAssignment.description,
          subject_id: newAssignment.subject_id,
          due_date: newAssignment.due_date,
          created_at: new Date().toISOString(),
          teacher_id: user.id,
          year: newAssignment.year,
          class_id: newAssignment.class_id, // include this
        },
      ]);
      if (error) throw error;
      // Refresh assignments
      const { data: assignmentData } = await supabase
        .from("assignments")
        .select(
          `
          id,
          title,
          description,
          due_date,
          created_at,
          subject:subject_id (
            id,
            name
          ),
          year
        `
        )
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
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
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
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
    <div className="w-full p-4">
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
                          {assignment.class?.name}
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
                          <button className="text-blue-600 hover:text-blue-900">
                            <FaEye className="text-lg" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
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
            <form onSubmit={handleCreateAssignment}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Row 1: Title + Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Subject
                  </label>
                  <select
                    required
                    value={newAssignment.subject_id}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        subject_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Row 2: Year + Class */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Year
                  </label>
                  <select
                    required
                    value={newAssignment.year}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        year: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  >
                    <option value="">Select year</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Class
                  </label>
                  <select
                    required
                    value={newAssignment.class_id}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        class_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.department}, Year {cls.year})
                      </option>
                    ))}
                  </select>
                </div>
                {/* Row 3: Due Date + Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newAssignment.due_date}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        due_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  />
                </div>
                <div className="md:col-span-1 col-span-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold shadow-sm transition-colors"
                >
                  Create Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold shadow-sm transition-colors"
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
