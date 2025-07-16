import React, { useEffect, useState } from "react";
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
async function uploadFilesToStorage(files, folder = "uploads") {
  const urls = [];
  for (const file of files) {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("public-files")
      .upload(filePath, file);
    if (error) throw error;
    // Get public URL
    const { data } = supabase.storage
      .from("public-files")
      .getPublicUrl(filePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

// Student Form
const StudentForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    address: "",
    gender: "Male",
    year: "",
    reg_no: "",
    email: "",
    hashed_password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "first_name",
      "last_name",
      "date_of_birth",
      "address",
      "year",
      "reg_no",
      "email",
      "hashed_password",
    ];
    if (required.some((field) => !form[field])) {
      alert("Please fill all required fields.");
      return;
    }
    if (form.hashed_password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (form.hashed_password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await createStudent(form);
      if (error) throw error;
      alert("Student added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to add student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <input
        name="first_name"
        placeholder="First Name*"
        className={inputStyle}
        value={form.first_name}
        onChange={handleChange}
      />
      <input
        name="middle_name"
        placeholder="Middle Name"
        className={inputStyle}
        value={form.middle_name}
        onChange={handleChange}
      />
      <input
        name="last_name"
        placeholder="Last Name*"
        className={inputStyle}
        value={form.last_name}
        onChange={handleChange}
      />
      <input
        type="date"
        name="date_of_birth"
        className={inputStyle}
        value={form.date_of_birth}
        onChange={handleChange}
      />
      <input
        name="address"
        placeholder="Address*"
        className={inputStyle}
        value={form.address}
        onChange={handleChange}
      />
      <select
        name="gender"
        className={inputStyle}
        value={form.gender}
        onChange={handleChange}
      >
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <input
        name="year"
        placeholder="year*"
        className={inputStyle}
        value={form.year}
        onChange={handleChange}
      />
      <input
        name="reg_no"
        placeholder="Registration No*"
        className={inputStyle}
        value={form.reg_no}
        onChange={handleChange}
      />
      <input
        name="email"
        type="email"
        placeholder="Email*"
        className={inputStyle}
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="hashed_password"
        type="password"
        placeholder="Password* (min 6 characters)"
        className={inputStyle}
        value={form.hashed_password}
        onChange={handleChange}
      />
      <input
        name="confirm_password"
        type="password"
        placeholder="Confirm Password*"
        className={inputStyle}
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
      />
      <div className="md:col-span-2 flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Adding..." : "Save"}
        </button>
      </div>
    </form>
  );
};

// Teacher Form
const TeacherForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "Rather not to say",
    email: "",
    phone: "",
    password: "",
    hashed_password: "",
    department_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDeptLoading(true);
      const depts = await getAllDepartments();
      setDepartments(depts || []);
      setDeptLoading(false);
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "password",
      "hashed_password",
      "department_id",
    ];
    if (required.some((f) => !form[f])) {
      alert("Please fill all required fields.");
      return;
    }

    if (form.password !== form.hashed_password) {
      alert("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await createTeacher(form);
      if (error) throw error;
      // Insert into teacher_departments
      // (Assume teacherId is generated or returned from createTeacher)
      // You may need to fetch the teacher by email if needed
      alert("Teacher added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to add teacher: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="first_name"
        placeholder="First Name*"
        className={inputStyle}
        value={form.first_name}
        onChange={handleChange}
      />
      <input
        name="last_name"
        placeholder="Last Name*"
        className={inputStyle}
        value={form.last_name}
        onChange={handleChange}
      />
      <select
        name="gender"
        placeholder="Gender"
        className={inputStyle}
        value={form.gender}
        onChange={handleChange}
      >
        <option>Select your Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <input
        name="email"
        type="email"
        placeholder="Email*"
        className={inputStyle}
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="phone"
        placeholder="Phone Number*"
        className={inputStyle}
        value={form.phone}
        onChange={handleChange}
      />
      <select
        name="department_id"
        className={inputStyle}
        value={form.department_id}
        onChange={handleChange}
        disabled={deptLoading}
      >
        <option value="">Select Department*</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
      <input
        name="password"
        type="password"
        placeholder="Password* (min 6 characters)"
        className={inputStyle}
        value={form.password}
        onChange={handleChange}
      />
      <input
        name="hashed_password"
        type="password"
        placeholder="Confirm Password*"
        className={inputStyle}
        value={form.hashed_password}
        onChange={handleChange}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Adding..." : "Save"}
        </button>
      </div>
    </form>
  );
};

// Notice Form
const NoticeForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_global: true,
    to_all_teachers: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await createNotice(form);
      if (error) throw error;
      alert("Notice published!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to publish notice: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="title"
        placeholder="Notice Title*"
        className={inputStyle}
        value={form.title}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description*"
        rows={3}
        className={inputStyle}
        value={form.description}
        onChange={handleChange}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_global"
          checked={form.is_global}
          onChange={handleChange}
        />
        Global Notice
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="to_all_teachers"
          checked={form.to_all_teachers}
          onChange={handleChange}
        />
        To All Teachers
      </label>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
};

// Add Assignment Form
const AssignmentForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    subject_id: "",
    due_date: "",
    teacher_id: "",
    year: "",
    // class_id: "", // Uncomment if you want to support class_id
  });
  const [loading, setLoading] = React.useState(false);
  const [subjects, setSubjects] = React.useState([]);
  const [teachers, setTeachers] = React.useState([]);

  React.useEffect(() => {
    const fetchSubjects = async () => {
      const data = await getAllSubjects();
      if (data) setSubjects(data);
    };
    const fetchTeachers = async () => {
      const data = await getAllTeachers();
      if (data) setTeachers(data);
    };
    fetchSubjects();
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "title",
      "description",
      "subject_id",
      "due_date",
      "teacher_id",
      "year",
    ];
    if (required.some((f) => !form[f])) {
      alert("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      // Only send class_id if you want to support it, otherwise omit
      const { error } = await createAssignment(form);
      if (error) throw error;
      alert("Assignment added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to add assignment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="title"
        placeholder="Title*"
        className={inputStyle}
        value={form.title}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description*"
        className={inputStyle}
        value={form.description}
        onChange={handleChange}
        rows={3}
      />
      <select
        name="subject_id"
        className={inputStyle}
        value={form.subject_id}
        onChange={handleChange}
      >
        <option value="">Select Subject*</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        name="due_date"
        type="datetime-local"
        className={inputStyle}
        value={form.due_date}
        onChange={handleChange}
      />
      <select
        name="teacher_id"
        className={inputStyle}
        value={form.teacher_id}
        onChange={handleChange}
      >
        <option value="">Select Teacher*</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.first_name} {t.last_name}
          </option>
        ))}
      </select>
      <select
        name="year"
        className={inputStyle}
        value={form.year}
        onChange={handleChange}
      >
        <option value="">Select Year*</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      {/*
      <input
        name="class_id"
        placeholder="Class ID (optional)"
        className={inputStyle}
        value={form.class_id || ""}
        onChange={handleChange}
      />
      */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Adding..." : "Save"}
        </button>
      </div>
    </form>
  );
};

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
    </div>
  );
};

export default MainDashboard;
