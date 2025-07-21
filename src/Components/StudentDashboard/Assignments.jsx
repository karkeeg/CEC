import React, { useState, useEffect } from "react";
import supabase from "../../supabaseConfig/supabaseClient"; // adjust path
import { FaLink, FaSearch, FaDownload, FaCheck } from "react-icons/fa";
import { IoMdArrowDropdown } from "react-icons/io";
import { BiReset } from "react-icons/bi";
import { MdAssignmentLate } from "react-icons/md";
import { IoBookOutline } from "react-icons/io5";
import { FaRegFileAlt, FaEye, FaUpload } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import { FaCalendarAlt, FaUser } from "react-icons/fa";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const Assignments = () => {
  const { user, role } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("2025-01-01");
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null); // assignment to view
  const [submitModal, setSubmitModal] = useState(null); // assignment to submit
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({}); // {assignment_id: true/false}
  const [submissionNotes, setSubmissionNotes] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      let classIdSet = new Set();
      if (role === "student" && user?.id) {
        // Fetch all class_ids for this student
        const { data: studentClasses, error: scError } = await supabase
          .from("student_classes")
          .select("class_id")
          .eq("student_id", user.id);
        if (scError) {
          console.error("Error fetching student classes:", scError);
          setAssignments([]);
          setLoading(false);
          return;
        }
        classIdSet = new Set(studentClasses?.map((sc) => sc.class_id) || []);
      }
      // Fetch all assignments (optionally filtered by date)
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          id,
          title,
          due_date,
          teacher_id,
          year,
          class_id,
          description,
          subject:subject_id (
            name
          ),
          files
        `
        )
        .gte("due_date", date)
        .order("due_date", { ascending: true });
      if (error) {
        console.error("Error fetching assignments:", error);
        setAssignments([]);
        setLoading(false);
        return;
      }
      // Only keep assignments for classes the student is enrolled in
      let filtered = data;
      if (role === "student") {
        filtered = data.filter((a) => classIdSet.has(a.class_id));
      }
      setAssignments(filtered);
      setLoading(false);
    };
    fetchAssignments();
  }, [date, user, role]);

  // Fetch submission status for all assignments for this student
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.id || assignments.length === 0) return;
      const { data, error } = await supabase
        .from("submissions")
        .select("assignment_id, files, notes")
        .in(
          "assignment_id",
          assignments.map((a) => a.id)
        )
        .eq("student_id", user.id);
      if (!error && data) {
        const status = {};
        data.forEach((s) => {
          status[s.assignment_id] = {
            submitted: true,
            files: s.files,
            notes: s.notes,
          };
        });
        setSubmissionStatus(status);
      }
    };
    fetchSubmissions();
  }, [assignments, user]);

  // Filter assignments by search term
  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  // Analytics: Progress bar and stats
  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter(
    (a) => submissionStatus[a.id]?.submitted
  ).length;
  const overdueCount = assignments.filter(
    (a) =>
      !submissionStatus[a.id]?.submitted && new Date(a.due_date) < new Date()
  ).length;
  const pendingCount = totalAssignments - submittedCount;
  const percentSubmitted =
    totalAssignments > 0
      ? Math.round((submittedCount / totalAssignments) * 100)
      : 0;
  // For chart: assignments due per week
  const weekMap = {};
  assignments.forEach((a) => {
    const due = new Date(a.due_date);
    // Get ISO week string (YYYY-WW)
    const week = `${due.getFullYear()}-W${String(
      Math.ceil(
        ((due - new Date(due.getFullYear(), 0, 1)) / 86400000 +
          new Date(due.getFullYear(), 0, 1).getDay() +
          1) /
          7
      )
    ).padStart(2, "0")}`;
    weekMap[week] = (weekMap[week] || 0) + 1;
  });
  const chartLabels = Object.keys(weekMap).sort();
  const chartData = chartLabels.map((w) => weekMap[w]);
  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Assignments Due",
        data: chartData,
        backgroundColor: "#2563eb",
        borderRadius: 6,
      },
    ],
  };
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { title: { display: true, text: "Week" }, grid: { display: false } },
      y: {
        title: { display: true, text: "Assignments Due" },
        beginAtZero: true,
        precision: 0,
        grid: { color: "#e0e7ef" },
      },
    },
  };
  // Doughnut chart for status breakdown
  const doughnutData = {
    labels: ["Submitted", "Pending", "Overdue"],
    datasets: [
      {
        data: [submittedCount, pendingCount - overdueCount, overdueCount],
        backgroundColor: ["#22c55e", "#facc15", "#ef4444"],
        borderWidth: 2,
      },
    ],
  };
  const doughnutOptions = {
    cutout: "70%",
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: { enabled: true },
    },
  };

  // Handle file upload and submission
  const handleSubmitAssignment = async (assignment) => {
    if (!file || !user?.id) return;
    setSubmitting(true);
    try {
      // 1. Upload file to Supabase Storage (bucket: public-files)
      const fileExt = file.name.split(".").pop();
      const filePath = `submissions/${user.id}/${
        assignment.id
      }-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("public-files")
        .upload(filePath, file);

      if (uploadError) {
        alert(uploadError.message || "Failed to upload file.");
        setSubmitting(false);
        return;
      }

      // 2. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("public-files")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 3. Insert submission record
      const submissionId =
        window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : `${user.id}-${assignment.id}-${Date.now()}`;
      const { error } = await supabase.from("submissions").insert([
        {
          id: submissionId,
          assignment_id: assignment.id,
          student_id: user.id,
          files: [fileUrl], // must be an array
          notes: submissionNotes,
        },
      ]);
      if (!error) {
        setSubmissionStatus((prev) => ({
          ...prev,
          [assignment.id]: {
            submitted: true,
            files: [fileUrl],
            notes: submissionNotes,
          },
        }));
        setSubmitModal(null);
        setFile(null);
        setSubmissionNotes("");
        alert("Assignment submitted successfully!");
      } else {
        alert(error.message || "Failed to submit assignment.");
      }
    } catch (err) {
      alert("Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if assignment is overdue
  const isOverdue = (a) =>
    !submissionStatus[a.id]?.submitted && new Date(a.due_date) < new Date();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <main className="w-full p-6 sm:p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Assignments
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Manage your assignments, view due dates, and track submission
            status.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md outline-none cursor-pointer w-full md:w-auto"
          />
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 rounded-md pl-10 border border-gray-300 text-black"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md flex items-center gap-2 text-white shadow-md w-full md:w-auto justify-center">
            Export PDF <FaDownload />
          </button>
        </div>

        {/* Modern Table */}
        <div className="overflow-x-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-xl mt-4 shadow-md">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-cyan-900 text-white text-base">
                <th className="px-3 py-2 font-bold">#</th>
                <th className="px-3 py-2 font-bold">Title</th>
                <th className="px-3 py-2 font-bold">Subject</th>
                <th className="px-3 py-2 font-bold">Due</th>
                <th className="px-3 py-2 font-bold">Files</th>
                <th className="px-3 py-2 font-bold">Assigned by</th>
                <th className="px-3 py-2 font-bold text-center">Status</th>
                <th className="px-3 py-2 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-gray-500 text-base font-semibold"
                  >
                    Loading assignments...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-gray-500 text-base font-semibold"
                  >
                    No assignments found.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-blue-100 ${
                      i % 2 === 0
                        ? "bg-blue-50 text-black"
                        : "bg-white text-black"
                    } text-sm hover:bg-blue-100 transition`}
                  >
                    <td className="px-3 py-2 font-semibold">{i + 1}</td>
                    <td className="px-3 py-2 font-medium truncate max-w-[120px]">
                      {a.title}
                    </td>
                    <td className="px-3 py-2 flex items-center gap-1 font-medium">
                      <IoBookOutline className="text-blue-400" />
                      <span className="truncate max-w-[80px]">
                        {a.subject?.name ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {new Date(a.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {a.files ? (
                        Array.isArray(a.files) ? (
                          a.files.map((file, idx) => (
                            <a
                              key={idx}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 hover:underline mr-1"
                              title={`Download File ${idx + 1}`}
                            >
                              <FaDownload className="inline" />
                            </a>
                          ))
                        ) : (
                          <a
                            href={a.files}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                            title="Download File"
                          >
                            <FaDownload className="inline" />
                          </a>
                        )
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium truncate max-w-[80px]">
                      {a.teacher_id}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {submissionStatus[a.id]?.submitted ? (
                        <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold text-xs">
                          ✔
                        </span>
                      ) : isOverdue(a) ? (
                        <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold text-xs">
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold text-xs">
                          ⏳
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold transition"
                          onClick={() => setViewModal(a)}
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          className={`px-3 py-1 rounded text-xs font-semibold transition ${
                            submissionStatus[a.id]?.submitted || isOverdue(a)
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-green-100 hover:bg-green-200 text-green-700"
                          }`}
                          onClick={() =>
                            !submissionStatus[a.id]?.submitted &&
                            !isOverdue(a) &&
                            setSubmitModal(a)
                          }
                          disabled={
                            !!submissionStatus[a.id]?.submitted || isOverdue(a)
                          }
                          title={
                            submissionStatus[a.id]?.submitted
                              ? "Already Submitted"
                              : isOverdue(a)
                              ? "Submission not allowed (Overdue)"
                              : "Submit Assignment"
                          }
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Analytics Section - Modern Cards and Charts */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-100 via-white to-blue-50 rounded-2xl shadow-lg p-6 flex flex-col items-center">
            <div className="w-full mb-4">
              <div className="text-base font-semibold text-blue-900 mb-2">
                Assignment Completion
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-700"
                  style={{ width: `${percentSubmitted}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{submittedCount} submitted</span>
                <span>{pendingCount} pending</span>
                <span>{overdueCount} overdue</span>
                <span>{percentSubmitted}%</span>
              </div>
            </div>
            <div className="w-full">
              <Doughnut
                data={doughnutData}
                options={doughnutOptions}
                height={180}
              />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-100 via-white to-blue-50 rounded-2xl shadow-lg p-6 flex flex-col items-center">
            <div className="w-full mb-4">
              <div className="text-base font-semibold text-green-900 mb-2">
                Assignments Due Per Week
              </div>
            </div>
            <div className="w-full">
              <Bar data={barChartData} options={barChartOptions} height={180} />
            </div>
          </div>
        </div>

        {/* View Modal */}
        {viewModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setViewModal(null)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-900">
                {viewModal.title}
              </h2>
              {submissionStatus[viewModal.id]?.submitted ? (
                <div className="mb-2">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-xs mb-2">
                    Submitted
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Submitted on:</strong>{" "}
                    {/* Show submission date if available */}
                    {/* If you store submission date in the status, show it here. Otherwise, show 'N/A' */}
                    N/A
                  </div>
                </div>
              ) : isOverdue(viewModal) ? (
                <div className="mb-2">
                  <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-xs mb-2">
                    Overdue
                  </span>
                  <div className="text-xs text-red-500 mt-1">
                    Submission not allowed. The due date has passed.
                  </div>
                </div>
              ) : null}
              <div className="mb-2 text-gray-700">
                <strong>Subject:</strong> {viewModal.subject?.name ?? "Unknown"}
              </div>
              <div className="mb-2 text-gray-700">
                <strong>Due Date:</strong>{" "}
                {new Date(viewModal.due_date).toLocaleDateString()}
              </div>
              <div className="mb-2 text-gray-700">
                <strong>Assigned By:</strong> {viewModal.teacher_id}
              </div>
              <div className="mb-4 text-gray-700">
                <strong>Description:</strong>{" "}
                {viewModal.description || "No description provided."}
              </div>
              {submissionStatus[viewModal.id]?.submitted &&
                submissionStatus[viewModal.id]?.files && (
                  <div className="mb-4 text-gray-700">
                    <strong>
                      Submitted File
                      {submissionStatus[viewModal.id].files.length > 1
                        ? "s"
                        : ""}
                      :
                    </strong>
                    <ul className="list-disc list-inside mt-1">
                      {submissionStatus[viewModal.id].files.map(
                        (fileUrl, idx) => {
                          // Extract file name from URL
                          const fileName = fileUrl
                            .split("/")
                            .pop()
                            .split("?")[0];
                          return (
                            <li key={idx}>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 underline"
                              >
                                {fileName}
                              </a>
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </div>
                )}
              {submissionStatus[viewModal.id]?.submitted &&
                submissionStatus[viewModal.id]?.notes && (
                  <div className="mb-4 text-gray-700">
                    <strong>Submission Notes:</strong>{" "}
                    {submissionStatus[viewModal.id].notes}
                  </div>
                )}
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-semibold"
                onClick={() => setViewModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Submit Modal */}
        {submitModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setSubmitModal(null)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 text-green-900">
                Submit Assignment
              </h2>
              <div className="mb-4 text-gray-700">
                <strong>Assignment:</strong> {submitModal.title}
              </div>
              <textarea
                className="mb-4 border px-3 py-2 rounded w-full"
                placeholder="Add notes (optional)"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={3}
              />
              <input
                type="file"
                className="mb-4 border px-3 py-2 rounded w-full"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              />
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow font-semibold disabled:opacity-60"
                onClick={() => handleSubmitAssignment(submitModal)}
                disabled={submitting || !file}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Assignments;
