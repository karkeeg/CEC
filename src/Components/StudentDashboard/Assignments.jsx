import React, { useState, useEffect, useMemo } from "react";
import supabase from "../../supabaseConfig/supabaseClient"; // adjust path
import { FaLink, FaSearch, FaDownload, FaCheck, FaClock, FaChartBar } from "react-icons/fa";
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
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Chart Options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: 'rgba(99, 102, 241, 1)'
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
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
        alert(uploadError.message || "Failed to upload file.");
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

      

            {/* Subject Performance - Horizontal Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IoBookOutline className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Subject Performance
                </h2>
              </div>
              <div className="h-64">
                <Bar data={subjectBarData} options={barOptions} />
              </div>
            </div>
          </div>

        
      

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-900">
                  {viewModal.title}
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={() => setViewModal(null)}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {submissionStatus[viewModal.id]?.submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-sm mb-2">
                    ✓ Submitted
                  </span>
                  <div className="text-sm text-gray-600">
                    <strong>Status:</strong> Assignment has been submitted successfully!
                  </div>
                </div>
              ) : isOverdue(viewModal) ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-sm mb-2">
                    Overdue
                  </span>
                  <div className="text-sm text-red-600">
                    Submission not allowed. The due date has passed.
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold text-sm mb-2">
                    Pending
                  </span>
                  <div className="text-sm text-yellow-700">
                    Assignment is pending submission
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <strong className="text-gray-700">Subject:</strong>
                      <span className="ml-2 text-gray-600">{viewModal.subject?.name ?? "Unknown"}</span>
                    </div>
                    <div>
                      <strong className="text-gray-700">Due Date:</strong>
                      <span className="ml-2 text-gray-600">
                        {new Date(viewModal.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <strong className="text-gray-700">Assigned By:</strong>
                      <span className="ml-2 text-gray-600">{viewModal.teacher_id}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="text-gray-700">Description:</strong>
                  <p className="mt-2 text-gray-600 bg-gray-50 rounded-lg p-3">
                    {viewModal.description || "No description provided."}
                  </p>
                </div>

                {submissionStatus[viewModal.id]?.submitted && submissionStatus[viewModal.id]?.files && (
                  <div>
                    <strong className="text-gray-700">Submitted Files:</strong>
                    <ul className="mt-2 space-y-2">
                      {submissionStatus[viewModal.id].files.map((fileUrl, idx) => {
                        const fileName = fileUrl.split("/").pop().split("?")[0];
                        return (
                          <li key={idx} className="bg-gray-50 rounded-lg p-3">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                            >
                              <FaDownload />
                              {fileName}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {submissionStatus[viewModal.id]?.submitted && submissionStatus[viewModal.id]?.notes && (
                  <div>
                    <strong className="text-gray-700">Submission Notes:</strong>
                    <p className="mt-2 text-gray-600 bg-gray-50 rounded-lg p-3">
                      {submissionStatus[viewModal.id].notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                onClick={() => setViewModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-green-900">
                  Submit Assignment
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={() => setSubmitModal(null)}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <strong className="text-gray-700">Assignment:</strong>
                <span className="ml-2 text-gray-600">{submitModal.title}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Add any notes about your submission..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File *
                </label>
                <input
                  type="file"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <button
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                onClick={() => handleSubmitAssignment(submitModal)}
                disabled={submitting || !file}
              >
                {submitting ? "Submitting..." : "Submit Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;