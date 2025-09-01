import React, { useState, useEffect, useMemo } from "react";
import supabase from "../../supabaseConfig/supabaseClient"; // adjust path
import { FaLink, FaSearch, FaDownload, FaCheck, FaClock, FaChartBar, FaFileAlt, FaTimes, FaCloudUploadAlt, FaSpinner, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import Modal from "../Modal";
import Swal from 'sweetalert2';
import { Doughnut, Line, Bar } from "react-chartjs-2";
import { IoMdArrowDropdown } from "react-icons/io";
import { BiReset } from "react-icons/bi";
import { MdAssignmentLate, MdTrendingUp } from "react-icons/md";
import { IoBookOutline } from "react-icons/io5";
import { FaRegFileAlt, FaEye, FaUpload } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import { FaCalendarAlt, FaUser } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from "chart.js";
import { logActivity } from "../../supabaseConfig/supabaseApi";
import {
  getAssignmentsForStudent,
  getSubmissionsForStudent,
} from "../../supabaseConfig/supabaseApi";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement,
  Filler
);

const Assignments = () => {
  const { user, role } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("2025-01-01");
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [submissionNotes, setSubmissionNotes] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await getAssignmentsForStudent(user.id, date);
        setAssignments(data || []);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [date, user]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.id || assignments.length === 0) return;
      const data = await getSubmissionsForStudent(
        user.id,
        assignments.map((a) => a.id)
      );
      if (data) {
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

  const filteredAssignments = useMemo(() => {
    if (!search) return assignments;
    return assignments.filter((a) =>
      a.subject?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [assignments, search]);

  const analyticsData = useMemo(() => {
    const totalAssignments = assignments.length;
    const submittedCount = assignments.filter(
      (a) => submissionStatus[a.id]?.submitted
    ).length;
    const overdueCount = assignments.filter(
      (a) =>
        !submissionStatus[a.id]?.submitted && new Date(a.due_date) < new Date()
    ).length;
    const pendingCount = totalAssignments - submittedCount - overdueCount;
    const percentSubmitted =
      totalAssignments > 0
        ? Math.round((submittedCount / totalAssignments) * 100)
        : 0;

    // Generate submission trend data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        submissions: Math.floor(Math.random() * 3) + (i < 3 ? 0 : 1) // More realistic random data
      };
    });

    // Subject-wise performance data
    const subjectPerformance = {};
    assignments.forEach(a => {
      const subject = a.subject?.name || 'Unknown';
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, submitted: 0, overdue: 0, pending: 0 };
      }
      subjectPerformance[subject].total++;
      if (submissionStatus[a.id]?.submitted) {
        subjectPerformance[subject].submitted++;
      } else if (new Date(a.due_date) < new Date()) {
        subjectPerformance[subject].overdue++;
      } else {
        subjectPerformance[subject].pending++;
      }
    });

    const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      completionRate: data.total > 0 ? Math.round((data.submitted / data.total) * 100) : 0,
      ...data
    }));

    // Priority distribution (mock data for demonstration)
    const priorityData = {
      urgent: overdueCount,
      high: Math.floor(pendingCount * 0.3),
      medium: Math.floor(pendingCount * 0.5),
      low: Math.floor(pendingCount * 0.2)
    };

    return {
      totalAssignments,
      submittedCount,
      overdueCount,
      pendingCount,
      percentSubmitted,
      trendData: last7Days,
      subjectData,
      priorityData
    };
  }, [assignments, submissionStatus]);

  const isOverdue = (a) =>
    !submissionStatus[a.id]?.submitted && new Date(a.due_date) < new Date();

  const { 
    totalAssignments, 
    submittedCount, 
    overdueCount, 
    pendingCount, 
    percentSubmitted, 
    trendData, 
    subjectData, 
    priorityData 
  } = analyticsData;

  // Modern Doughnut Chart for Status Overview
  const statusDoughnutData = {
    labels: ["Completed", "Pending", "Overdue"],
    datasets: [
      {
        data: [submittedCount, pendingCount, overdueCount],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",   // Green for completed
          "rgba(59, 130, 246, 0.8)",   // Blue for pending  
          "rgba(239, 68, 68, 0.8)"     // Red for overdue
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)", 
          "rgba(239, 68, 68, 1)"
        ],
        borderWidth: 3,
        cutout: "70%",
        hoverOffset: 8,
      },
    ],
  };

  // Submission Trend Line Chart
  const trendLineData = {
    labels: trendData.map(d => d.label),
    datasets: [
      {
        label: "Daily Submissions",
        data: trendData.map(d => d.submissions),
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

// Subject Performance Horizontal Bar Chart
const subjectBarData = {
  labels: subjectData.map(s => s.subject),
  datasets: [
    {
      label: "Completion Rate (%)",
      data: subjectData.map(s => s.completionRate),
      backgroundColor: subjectData.map((_, i) => {
        const colors = [
          "rgba(168, 85, 247, 0.8)",  // Purple
          "rgba(34, 197, 94, 0.8)",   // Green
          "rgba(59, 130, 246, 0.8)",  // Blue
          "rgba(245, 158, 11, 0.8)",  // Amber
          "rgba(239, 68, 68, 0.8)",   // Red
          "rgba(20, 184, 166, 0.8)"   // Teal
        ];
        return colors[i % colors.length];
      }),
      borderColor: subjectData.map((_, i) => {
        const colors = [
          "rgba(168, 85, 247, 1)",
          "rgba(34, 197, 94, 1)", 
          "rgba(59, 130, 246, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(20, 184, 166, 1)"
        ];
        return colors[i % colors.length];
      }),
      borderWidth: 2,
      borderRadius: 10,
      borderSkipped: false,
      barThickness: 30,
      maxBarThickness: 35,
    },
  ],
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  layout: {
    padding: {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      callbacks: {
        label: function(context) {
          return `Completion Rate: ${context.parsed.x}%`;
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: 'Completion Rate (%)',
        font: {
          size: 14,
          weight: 'bold'
        },
        color: '#374151'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.08)',
        lineWidth: 1
      },
      border: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        callback: function(value) {
          return value + '%';
        },
        font: {
          size: 12
        },
        color: '#6B7280',
        stepSize: 20
      }
    },
    y: {
      title: {
        display: true,
        text: 'Subjects',
        font: {
          size: 14,
          weight: 'bold'
        },
        color: '#374151'
      },
      grid: {
        display: false
      },
      border: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        font: {
          size: 13,
          weight: '600'
        },
        color: '#374151',
        padding: 10
      }
    }
  }
};



  const handleSubmitAssignment = async (assignment) => {
    if (!file || !user?.id) return;
    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `submissions/${user.id}/${
        assignment.id
      }-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("public-files")
        .upload(filePath, file);

      if (uploadError) {
        Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'File upload failed: ' + uploadError.message,
        customClass: {
          popup: 'swal-small'
        }
      });
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("public-files")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      const submissionId =
        window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : `${user.id}-${assignment.id}-${Date.now()}`;
      const { error } = await supabase.from("submissions").insert([
        {
          id: submissionId,
          assignment_id: assignment.id,
          student_id: user.id,
          files: [fileUrl],
          notes: submissionNotes,
        },
      ]);
      if (!error) {
        await logActivity(
          `Student ${user.first_name} ${user.last_name} submitted "${assignment.title}".`,
          "submission",
          {
            user_id: user.id,
            user_role: user.role,
            user_name: `${user.first_name} ${user.last_name}`,
          }
        );
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
        Swal.fire({
        icon: 'success',
        title: 'Submitted!',
        text: 'Assignment submitted successfully!',
        customClass: {
          popup: 'swal-small'
        }
      });
      } else {
        Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Submission failed: ' + error.message,
        customClass: {
          popup: 'swal-small'
        }
      });
      }
    } catch (err) {
      alert("Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
          Assignments
        </h1>
        <p className="text-gray-600 text-base md:text-lg">
          Manage your assignments, view due dates, and track submission status.
        </p>
      </div>

      {/* Main Content Container */}
      <div className="space-y-6">
        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md outline-none cursor-pointer"
              />
            </div>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject..."
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Assignment Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm md:text-base">
              <thead>
                <tr className="bg-cyan-900 text-white">
                  <th className="px-4 py-3 font-bold text-left">#</th>
                  <th className="px-4 py-3 font-bold text-left">Title</th>
                  <th className="px-4 py-3 font-bold text-left">Subject</th>
                  <th className="px-4 py-3 font-bold text-left">Due</th>
                  <th className="px-4 py-3 font-bold text-left">Files</th>
                  <th className="px-4 py-3 font-bold text-left">Assigned by</th>
                  <th className="px-4 py-3 font-bold text-center">Status</th>
                  <th className="px-4 py-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-lg font-semibold">
                      Loading assignments...
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-lg font-semibold">
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a, i) => (
                    <tr
                      key={a.id}
                      className={`border-b border-blue-100 ${
                        i % 2 === 0 ? "bg-blue-50" : "bg-white"
                      } hover:bg-blue-100 transition-colors duration-200`}
                    >
                      <td className="px-4 py-3 font-semibold">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        <div className="truncate max-w-[150px]" title={a.title}>
                          {a.title}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium">
                          <IoBookOutline className="text-blue-400" />
                          <span className="truncate max-w-[100px]">
                            {a.subject?.name ?? "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {new Date(a.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {a.files ? (
                          Array.isArray(a.files) ? (
                            a.files.map((file, idx) => (
                              <a
                                key={idx}
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 mr-2 transition-colors"
                                title={`Download File ${idx + 1}`}
                              >
                                <FaDownload />
                              </a>
                            ))
                          ) : (
                            <a
                              href={a.files}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 transition-colors"
                              title="Download File"
                            >
                              <FaDownload />
                            </a>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <div className="truncate max-w-[100px]">
                          {a.teacher.first_name} {a.teacher.last_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submissionStatus[a.id]?.submitted ? (
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-xs">
                            ✓ Submitted
                          </span>
                        ) : isOverdue(a) ? (
                          <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-xs">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold transition-colors"
                            onClick={() => setViewModal(a)}
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              submissionStatus[a.id]?.submitted || isOverdue(a)
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-green-100 hover:bg-green-200 text-green-700"
                            }`}
                            onClick={() =>
                              !submissionStatus[a.id]?.submitted &&
                              !isOverdue(a) &&
                              setSubmitModal(a)
                            }
                            disabled={!!submissionStatus[a.id]?.submitted || isOverdue(a)}
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
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <IoBookOutline className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Subject Performance
            </h2>
          </div>
          <div className="h-80">
            <Bar data={subjectBarData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Enhanced View Modal */}
      {viewModal && (
        <Modal 
          key="view-modal"
          title={
            <div>
              <h2 className="text-xl font-bold">{viewModal.title}</h2>
              <p className="text-sm font-normal">{viewModal.subject?.name || 'No Subject'}</p>
            </div>
          }
          onClose={() => setViewModal(null)}
          size="xl"
          contentClassName="max-h-[95vh] h-[80vh] overflow-y-auto"
        >
          <div className="">
            {/* Status Badge */}
            <div>
              {submissionStatus[viewModal.id]?.submitted ? (
                <div className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium  rounded-full">
                  <FaCheck className="mr-1.5" /> Submitted
                </div>
              ) : isOverdue(viewModal) ? (
                <div className="inline-flex items-center bg-red-100 text-red-800 text-sm font-medium  rounded-full">
                  <FaClock className="mr-1.5" /> Overdue
                </div>
              ) : (
                <div className="inline-flex items-center bg-yellow-100 text-yellow-800 text-sm font-medium  rounded-full">
                  <FaClock className="mr-1.5" /> Pending Submission
                </div>
              )}
            </div>

            {/* Assignment Details */}
            <div className="p-6 space-y-6">
              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">
                    {new Date(viewModal.due_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned By</p>
                  <p className="font-medium">
                    {viewModal.teacher?.first_name} {viewModal.teacher?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{viewModal.subject?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {submissionStatus[viewModal.id]?.submitted 
                      ? 'Submitted' 
                      : isOverdue(viewModal) 
                        ? 'Overdue' 
                        : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Assignment Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <div className="prose max-w-none text-gray-700 bg-white p-4 border border-gray-200 rounded-lg">
                  {viewModal.description || 'No description provided for this assignment.'}
                </div>
              </div>

              {/* Attached Files */}
              {viewModal.files && viewModal.files.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Attached Files</h3>
                  <div className="space-y-2">
                    {(Array.isArray(viewModal.files) ? viewModal.files : [viewModal.files])
                      .filter(Boolean)
                      .map((fileUrl, idx) => (
                        <a
                          key={idx}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="p-2 bg-blue-50 rounded-lg mr-3">
                            <FaFileAlt className="text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileUrl.split('/').pop()?.split('?')[0] || 'Download File'}
                            </p>
                          </div>
                          <FaDownload className="text-gray-400" />
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* Submission Details */}
              {submissionStatus[viewModal.id]?.submitted && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Your Submission</h3>
                  
                  {/* Submitted Files */}
                  {submissionStatus[viewModal.id]?.files?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Files</h4>
                      <div className="space-y-2">
                        {submissionStatus[viewModal.id].files.map((fileUrl, idx) => (
                          <a
                            key={idx}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
                          >
                            <FaFileAlt className="text-blue-500 mr-2" />
                            <span className="text-sm text-blue-600 hover:underline truncate flex-1">
                              {fileUrl.split('/').pop()?.split('?')[0] || 'Download File'}
                            </span>
                            <FaDownload className="text-gray-400" size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Notes */}
                  {submissionStatus[viewModal.id]?.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Notes</h4>
                      <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700">
                        {submissionStatus[viewModal.id].notes}
                      </div>
                    </div>
                  )}

                  {/* Submission Time */}
                  <div className="mt-3 text-sm text-gray-500">
                    Submitted on {new Date().toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => setViewModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              {!submissionStatus[viewModal.id]?.submitted && !isOverdue(viewModal) && (
                <button
                  onClick={() => {
                    setSubmitModal(viewModal);
                    setViewModal(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit Assignment
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Enhanced Submit Modal */}
      {submitModal && (
        <Modal
          key="submit-modal"
          title={
            <div>
              <h2 className="text-xl font-bold">Submit Assignment</h2>
              <p className="text-sm font-normal">{submitModal.title}</p>
            </div>
          }
          onClose={() => setSubmitModal(null)}
          size="md"
        >
          <div className="p-6 space-y-6">
            {/* Due Date Warning */}
            {new Date(submitModal.due_date) < new Date() ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        This assignment is <span className="font-bold">overdue</span>. Submissions may not be accepted.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Due {new Date(submitModal.due_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload your work <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={(e) => setFile(e.target.files[0])}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB
                      </p>
                      {file && (
                        <p className="text-sm text-gray-900 mt-2">
                          <FaFileAlt className="inline mr-2 text-blue-500" />
                          {file.name}
                          <button
                            onClick={() => setFile(null)}
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            <FaTimes />
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submission Notes */}
                <div>
                  <label htmlFor="submission-notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Notes (Optional)
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="submission-notes"
                      name="submission-notes"
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                      placeholder="Add any additional notes about your submission..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Include any comments or context about your submission.
                  </p>
                </div>
              </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSubmitModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitAssignment(submitModal)}
                disabled={submitting || !file}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  submitting || !file
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Assignment'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Assignments;