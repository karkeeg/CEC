import React, { useEffect, useState, useRef } from "react";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMoneyBillWave,
  FaPercentage,
  FaBell,
  FaPlus,
} from "react-icons/fa";
import {
  createStudent,
  createTeacher,
  createNotice,
  createAssignment,
  getAllStudents,
  getAllTeachers,
  getAllFees,
  getAllAttendance,
  getAllAssignments,
  getAllDepartments,
  getAllSubjects,
  fetchRecentSubmissions,
  fetchRecentAssignments,
  fetchRecentNotices,
  getAllNotices,
  addGalleryItems,
  logActivity,
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import { StudentForm } from "../Forms/StudentForm";
import { TeacherForm } from "../Forms/TeacherForm";
import { NoticeForm } from "../Forms/NoticeForm";
import { AssignmentForm } from "../Forms/AssignmentForm";
import { sendConfirmationEmail } from "../../utils/emailService";

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-[#EEF0FD] rounded-lg w-full max-w-lg relative overflow-hidden shadow-lg">
      {/* Modal Header */}
      <div className="bg-[#2C7489] text-white text-lg font-semibold px-6 py-4 flex justify-between items-center">
        <h2>{title}</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-red-200 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-4 bg-[#EEF0FD]">{children}</div>
    </div>
  </div>
);

// Common input style
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

// Main Component
const MainDashboard = () => {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [paidFee, setPaidFee] = useState(0);
  const [unpaidFee, setUnpaidFee] = useState(0);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [notices, setNotices] = useState([]);
  const [editNotice, setEditNotice] = useState(null);
  const [visibleNoticesCount, setVisibleNoticesCount] = useState(3);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDescription, setGalleryDescription] = useState("");

  const fetchStats = async () => {
    const students = await getAllStudents();
    setStudentCount(students?.length || 0);

    const teachers = await getAllTeachers();
    setTeacherCount(teachers?.length || 0);

    const fees = await getAllFees();
    const paid =
      fees
        ?.filter((f) => f.status === "unpaid")
        .reduce((acc, f) => acc + f.paid_amount, 0) || 0;
    const unpaid =
      fees
        ?.filter((f) => f.status === "unpaid")
        .reduce((acc, f) => acc + f.amount, 0) || 0;
    setPaidFee(paid);
    setUnpaidFee(unpaid);

    const attendance = await getAllAttendance();
    const total = attendance?.length || 1;
    const present =
      attendance?.filter((a) => a.status === "present").length || 0;
    setAttendancePercent(Math.round((present / total) * 100));

    const notifyRes = await supabase
      .from("notifications")
      .select("*")
      .order("date", { ascending: false });
    setNotifications(notifyRes.data || []);

    // Fetch all notices for management
    const allNotices = await getAllNotices();
    setNotices(allNotices || []);
  };

  useEffect(() => {
    fetchStats();
    // Fetch recent activities
    const fetchActivities = async () => {
      const [subs, assigns, notices] = await Promise.all([
        fetchRecentSubmissions(5),
        fetchRecentAssignments(5),
        fetchRecentNotices(5),
      ]);
      console.log("Recent Submissions:", subs);
      console.log("Recent Assignments:", assigns);
      console.log("Recent Notices:", notices);
      const activities = [
        ...subs.map((s) => ({
          type: "submission",
          date: s.submitted_at,
          message: `Student ${
            s.students
              ? s.students.first_name + " " + s.students.last_name
              : s.student_id
          } submitted "${
            s.assignments ? s.assignments.title : s.assignment_id
          }"`,
        })),
        ...assigns.map((a) => ({
          type: "assignment",
          date: a.created_at,
          message: `Assignment "${a.title}" created by ${
            a.teachers
              ? a.teachers.first_name + " " + a.teachers.last_name
              : a.teacher_id
          }`,
        })),
        ...notices.map((n) => ({
          type: "notice",
          date: n.created_at,
          message: `Notice "${n.title}" published`,
          // id: n.notice_id // (optional, if you want to use it)
        })),
      ];
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities);
    };
    fetchActivities();
  }, []);

  const StatCard = ({ icon, label, value, highlight }) => (
    <div
      className={`bg-white shadow-md border-l-4 p-4 rounded-md ${highlight}`}
    >
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );

  const fileInputRef = useRef();

  const handleAddImageClick = () => {
    setGalleryFiles([]);
    setGalleryTitle("");
    setGalleryDescription("");
    setShowGalleryModal(true);
  };

  const handleGalleryFileChange = (event) => {
    setGalleryFiles(Array.from(event.target.files));
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!galleryTitle || galleryFiles.length === 0) {
      alert("Title and at least one image/video are required.");
      return;
    }
    try {
      const bucket = "gallery";
      const urls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        const url = publicUrlData?.publicUrl;
        if (!url) throw new Error("Failed to get public URL");
        urls.push(url);
      }
      const { error: insertError } = await addGalleryItems([
        {
          title: galleryTitle,
          description: galleryDescription,
          image_url: urls,
          created_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;
      await logActivity(
        `Gallery topic "${galleryTitle}" added with ${urls.length} media file(s).`,
        "gallery",
        typeof currentUser !== "undefined" ? currentUser : {}
      );
      alert("Gallery topic and media uploaded!");
      setShowGalleryModal(false);
      setGalleryFiles([]);
      setGalleryTitle("");
      setGalleryDescription("");
      // Optionally: refresh gallery images here
    } catch (error) {
      alert("Failed to upload gallery: " + (error.message || error));
    }
  };

  // Handler for when a student is successfully added
  const handleStudentAdded = async (student) => {
    console.log("handleStudentAdded called with:", student);
    await fetchStats();
    if (student && student.name && student.email) {
      try {
        console.log("Calling sendConfirmationEmail...");
        await sendConfirmationEmail({
          to_name: student.name,
          to_email: student.email,
          role: "student",
        });
        alert(`Confirmation email sent to ${student.email}`);
      } catch (error) {
        alert(
          `Failed to send confirmation email to ${student.email}: ${
            error?.text || error?.message || error
          }`
        );
        console.error("EmailJS send error (student):", error);
      }
    } else {
      console.warn("Student object missing name or email:", student);
    }
  };

  // Handler for when a teacher is successfully added
  const handleTeacherAdded = async (teacher) => {
    await fetchStats();
    if (teacher && teacher.name && teacher.email) {
      try {
        await sendConfirmationEmail({
          to_name: teacher.name,
          to_email: teacher.email,
          role: "teacher",
        });
        alert(`Confirmation email sent to ${teacher.email}`);
      } catch (error) {
        alert(
          `Failed to send confirmation email to ${teacher.email}: ${
            error?.text || error?.message || error
          }`
        );
        console.error("EmailJS send error (teacher):", error);
      }
    }
  };

  // Add a handler to refresh notices only
  const refreshNotices = async () => {
    const allNotices = await getAllNotices();
    setNotices(allNotices || []);
  };

  const typeBgClass = {
    notice: "bg-blue-100",
    assignment: "bg-purple-100",
    submission: "bg-green-100",
    student: "bg-cyan-100",
    teacher: "bg-yellow-100",
    class: "bg-orange-100",
    attendance: "bg-pink-100",
    fee: "bg-red-100",
    default: "bg-gray-100",
  };

  return (
    <div className="p-6 6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FaUserGraduate className="text-cyan-500 text-3xl" />}
          label="# Students"
          value={studentCount}
          highlight="border-cyan-500"
        />
        <StatCard
          icon={<FaChalkboardTeacher className="text-green-500 text-3xl" />}
          label="# Teachers"
          value={teacherCount}
          highlight="border-green-500"
        />
        <div className="bg-white shadow-md border-l-4 border-yellow-500 p-4 rounded-md">
          <div className="flex items-center gap-4">
            <FaMoneyBillWave className="text-yellow-500 text-3xl" />
            <div>
              <p className="text-gray-500 text-sm">Fee Summary</p>
              <p className="text-lg font-bold">
                Paid: Rs {paidFee.toLocaleString()}
              </p>
              <p className="text-lg font-bold">
                Unpaid: Rs {unpaidFee.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <StatCard
          icon={<FaPercentage className="text-purple-500 text-3xl" />}
          label="Attendance %"
          value={`${attendancePercent}%`}
          highlight="border-purple-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowStudentModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-green-700"
        >
          <FaPlus /> Add Student
        </button>
        <button
          onClick={() => setShowTeacherModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> Add Teacher
        </button>
        <button
          onClick={() => setShowNoticeModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-emerald-700"
        >
          <FaPlus /> Add Notice
        </button>
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-purple-700"
        >
          <FaPlus /> Add Assignment
        </button>
        <button
          onClick={handleAddImageClick}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-indigo-700"
        >
          <FaPlus /> Add Image
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-[#eef1fa] p-4 rounded-md shadow-md">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <ul className="space-y-2">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500">No activity found.</p>
          ) : (
            (showAllActivities
              ? recentActivities
              : recentActivities.slice(0, 5)
            ).map((act, idx) => (
              <li
                key={idx}
                className={`flex items-center justify-between px-4 py-2 rounded ${
                  typeBgClass[act.type] || typeBgClass.default
                } cursor-pointer`}
                onClick={() => setSelectedActivity(act)}
              >
                <div className="flex items-center gap-3">
                  <FaBell className="text-gray-700" />
                  <span className="font-medium text-sm">{act.message}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{new Date(act.date).toLocaleString()}</p>
                </div>
              </li>
            ))
          )}
        </ul>
        {recentActivities.length > 5 && (
          <button
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={() => setShowAllActivities((prev) => !prev)}
          >
            {showAllActivities ? "See Less" : "See More"}
          </button>
        )}
        {/* Activity Detail Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl"
                onClick={() => setSelectedActivity(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4">Activity Details</h3>
              <div className="mb-2">
                <strong>Type:</strong> {selectedActivity.type}
              </div>
              <div className="mb-2">
                <strong>Message:</strong> {selectedActivity.message}
              </div>
              <div className="mb-2">
                <strong>Date:</strong>{" "}
                {new Date(selectedActivity.date).toLocaleString()}
              </div>
              {/* Add more details here if available in selectedActivity */}
            </div>
          </div>
        )}
      </div>

      {/* Notices Management Table */}
      <div className="bg-white rounded shadow p-4 my-8">
        <h2 className="text-xl font-bold mb-4">Manage Notices</h2>
        {notices.length === 0 ? (
          <p className="text-gray-500">No notices found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notices.slice(0, visibleNoticesCount).map((notice) => (
                  <tr key={notice.notice_id}>
                    <td className="p-2 font-semibold">{notice.title}</td>
                    <td className="p-2">{notice.description}</td>
                    <td className="p-2">
                      {new Date(notice.created_at).toLocaleString()}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => setEditNotice(notice)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        onClick={async () => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this notice?"
                            )
                          ) {
                            const { deleteNotice } = await import(
                              "../../supabaseConfig/supabaseApi"
                            );
                            await deleteNotice(notice.notice_id);
                            await refreshNotices();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex gap-2">
              {visibleNoticesCount < notices.length && (
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => setVisibleNoticesCount((prev) => prev + 3)}
                >
                  See More
                </button>
              )}
              {visibleNoticesCount > 3 && (
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={() => setVisibleNoticesCount(3)}
                >
                  See Less
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showStudentModal && (
        <Modal title="Add Student" onClose={() => setShowStudentModal(false)}>
          <StudentForm
            onClose={() => setShowStudentModal(false)}
            onSuccess={handleStudentAdded}
          />
        </Modal>
      )}
      {showTeacherModal && (
        <Modal title="Add Teacher" onClose={() => setShowTeacherModal(false)}>
          <TeacherForm
            onClose={() => setShowTeacherModal(false)}
            onSuccess={handleTeacherAdded}
          />
        </Modal>
      )}
      {showNoticeModal && (
        <Modal title="Add New Notice" onClose={() => setShowNoticeModal(false)}>
          <NoticeForm
            onClose={() => setShowNoticeModal(false)}
            onSuccess={fetchStats}
          />
        </Modal>
      )}
      {editNotice && (
        <Modal title="Edit Notice" onClose={() => setEditNotice(null)}>
          <NoticeForm
            notice={editNotice}
            onClose={() => setEditNotice(null)}
            onSuccess={async () => {
              setEditNotice(null);
              await fetchStats();
            }}
            onDelete={async () => {
              setEditNotice(null);
              await fetchStats();
            }}
          />
        </Modal>
      )}
      {showAssignmentModal && (
        <Modal
          title="Add Assignment"
          onClose={() => setShowAssignmentModal(false)}
        >
          <AssignmentForm
            onClose={() => setShowAssignmentModal(false)}
            onSuccess={fetchStats}
          />
        </Modal>
      )}
      {/* Gallery Modal */}
      {showGalleryModal && (
        <Modal
          title="Add Gallery Topic"
          onClose={() => setShowGalleryModal(false)}
        >
          <form onSubmit={handleGallerySubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Title*"
              className={inputStyle}
              value={galleryTitle}
              onChange={(e) => setGalleryTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Description"
              className={inputStyle}
              value={galleryDescription}
              onChange={(e) => setGalleryDescription(e.target.value)}
            />
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleGalleryFileChange}
              className={inputStyle}
            />
            <div className="flex flex-wrap gap-2">
              {galleryFiles.map((file, idx) => (
                <div key={idx} className="bg-gray-100 p-2 rounded text-xs">
                  {file.name}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Upload
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MainDashboard;
