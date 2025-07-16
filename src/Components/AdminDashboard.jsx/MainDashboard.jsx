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
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import { StudentForm } from "../Forms/StudentForm";
import { TeacherForm } from "../Forms/TeacherForm";
import { NoticeForm } from "../Forms/NoticeForm";
import { AssignmentForm } from "../Forms/AssignmentForm";

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-[#EEF0FD] rounded-lg w-full max-w-lg relative overflow-hidden shadow-lg">
      {/* Modal Header */}
      <div className="bg-[#2C7489] text-white text-lg font-semibold px-6 py-4 flex justify-between items-center">
        <h2>{title}</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-red-300 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-4">{children}</div>
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
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const fetchStats = async () => {
    const students = await getAllStudents();
    setStudentCount(students?.length || 0);

    const teachers = await getAllTeachers();
    setTeacherCount(teachers?.length || 0);

    const fees = await getAllFees();
    const paid =
      fees
        ?.filter((f) => f.status === "paid")
        .reduce((acc, f) => acc + f.amount, 0) || 0;
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
  };

  useEffect(() => {
    fetchStats();
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
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Upload to Supabase Storage
    const filePath = `gallery/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("gallery")
      .upload(filePath, file);

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData?.publicUrl;
    if (!imageUrl) {
      alert("Failed to get public URL");
      return;
    }

    // 3. Insert into gallery table
    const { error: insertError } = await supabase.from("gallery").insert([
      {
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      alert("Failed to insert into gallery: " + insertError.message);
      return;
    }

    alert("Image uploaded and added to gallery!");
    // Optionally: refresh gallery images here
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
          {notifications.length === 0 ? (
            <p className="text-gray-500">No activity found.</p>
          ) : (
            notifications.map((note, idx) => (
              <li
                key={idx}
                className={`flex items-center justify-between px-4 py-2 rounded ${
                  idx === 0 ? "bg-red-200" : "bg-blue-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FaBell className="text-gray-700" />
                  <span className="font-medium text-sm">{note.message}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{note.date}</p>
                  <p>{note.time}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modals */}
      {showStudentModal && (
        <Modal title="Add Student" onClose={() => setShowStudentModal(false)}>
          <StudentForm
            onClose={() => setShowStudentModal(false)}
            onSuccess={fetchStats}
          />
        </Modal>
      )}
      {showTeacherModal && (
        <Modal title="Add Teacher" onClose={() => setShowTeacherModal(false)}>
          <TeacherForm
            onClose={() => setShowTeacherModal(false)}
            onSuccess={fetchStats}
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
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default MainDashboard;
