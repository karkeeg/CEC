import React, { useEffect, useState } from "react";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMoneyBillWave,
  FaPercentage,
  FaBell,
  FaPlus,
} from "react-icons/fa";
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

// Student Form
const StudentForm = ({ onClose }) => {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    address: "",
    gender: "Male",
    year: "",
    reg_no: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use correct field names for validation
    const required = [
      "first_name",
      "last_name",
      "dob",
      "address",
      "year",
      "reg_no",
      "email",
      "password",
      "confirm_password",
    ];
    if (required.some((field) => !form[field])) {
      alert("Please fill all required fields.");
      return;
    }

    if (form.password !== form.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Insert into students table
      const { error } = await supabase.from("students").insert([
        {
          reg_no: form.reg_no,
          email: form.email,
          hashed_password: form.password, // hash if needed
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          date_of_birth: form.dob,
          address: form.address,
          gender: form.gender,
          year: form.year,
        },
      ]);
      if (error) throw error;

      alert("Student added successfully!");
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
        name="dob"
        className={inputStyle}
        value={form.dob}
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
        name="password"
        type="password"
        placeholder="Password* (min 6 characters)"
        className={inputStyle}
        value={form.password}
        onChange={handleChange}
      />
      <input
        name="confirm_password"
        type="password"
        placeholder="Confirm Password*"
        className={inputStyle}
        value={form.confirm_password}
        onChange={handleChange}
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
const TeacherForm = ({ onClose }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "Rather not to say",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    department_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDeptLoading(true);
      const { data, error } = await supabase
        .from("departments")
        .select("id, name");
      if (!error && data) setDepartments(data);
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
      "confirm_password",
      "department_id",
    ];
    if (required.some((f) => !form[f])) {
      alert("Please fill all required fields.");
      return;
    }

    if (form.password !== form.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Insert into teachers table
      const teacherId = form.email.split("@")[0];
      const { error: teacherError } = await supabase.from("teachers").insert([
        {
          id: teacherId,
          email: form.email,
          hashed_password: form.password, // hash if needed
          first_name: form.first_name,
          middle_name: "", // add if you have it in the form
          last_name: form.last_name,
        },
      ]);
      if (teacherError) throw teacherError;

      // Insert into teacher_departments
      const { error: deptError } = await supabase
        .from("teacher_departments")
        .insert([
          {
            id: String(Date.now()),
            teacher_id: teacherId,
            department_id: form.department_id,
          },
        ]);
      if (deptError) throw deptError;

      alert("Teacher added successfully!");
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
        name="confirm_password"
        type="password"
        placeholder="Confirm Password*"
        className={inputStyle}
        value={form.confirm_password}
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
const NoticeForm = ({ onClose }) => {
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
      const { error } = await supabase.from("notices").insert([
        {
          notice_id: String(Date.now()),
          title: form.title,
          description: form.description,
          faculty_id: null,
          department_id: null,
          teacher_id: null,
          is_global: form.is_global,
          to_all_teachers: form.to_all_teachers,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      alert("Notice published!");
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
const AssignmentForm = ({ onClose }) => {
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    subject_id: "",
    due_date: "",
    teacher_id: "",
    year: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [subjects, setSubjects] = React.useState([]);
  const [teachers, setTeachers] = React.useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name");
      if (!error && data) setSubjects(data);
    };
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, first_name, last_name");
      if (!error && data) setTeachers(data);
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
      const { error } = await supabase.from("assignments").insert([
        {
          id: String(Date.now()),
          title: form.title,
          description: form.description,
          subject_id: form.subject_id,
          due_date: form.due_date,
          created_at: new Date().toISOString(),
          teacher_id: form.teacher_id,
          year: form.year,
        },
      ]);
      if (error) throw error;
      alert("Assignment added successfully!");
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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const studentRes = await supabase.from("students").select("*");
    setStudentCount(studentRes.data?.length || 0);

    const teacherRes = await supabase.from("teachers").select("*");
    setTeacherCount(teacherRes.data?.length || 0);

    const feeRes = await supabase.from("fees").select("amount, status");
    const paid =
      feeRes.data
        ?.filter((f) => f.status === "paid")
        .reduce((acc, f) => acc + f.amount, 0) || 0;
    const unpaid =
      feeRes.data
        ?.filter((f) => f.status === "unpaid")
        .reduce((acc, f) => acc + f.amount, 0) || 0;
    setPaidFee(paid);
    setUnpaidFee(unpaid);

    const attRes = await supabase.from("attendance").select("status");
    const total = attRes.data?.length || 1;
    const present =
      attRes.data?.filter((a) => a.status === "present").length || 0;
    setAttendancePercent(Math.round((present / total) * 100));

    const notifyRes = await supabase
      .from("notifications")
      .select("*")
      .order("date", { ascending: false });
    setNotifications(notifyRes.data || []);
  };

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
          <StudentForm onClose={() => setShowStudentModal(false)} />
        </Modal>
      )}
      {showTeacherModal && (
        <Modal title="Add Teacher" onClose={() => setShowTeacherModal(false)}>
          <TeacherForm onClose={() => setShowTeacherModal(false)} />
        </Modal>
      )}
      {showNoticeModal && (
        <Modal title="Add New Notice" onClose={() => setShowNoticeModal(false)}>
          <NoticeForm onClose={() => setShowNoticeModal(false)} />
        </Modal>
      )}
      {showAssignmentModal && (
        <Modal
          title="Add Assignment"
          onClose={() => setShowAssignmentModal(false)}
        >
          <AssignmentForm onClose={() => setShowAssignmentModal(false)} />
        </Modal>
      )}
    </div>
  );
};

export default MainDashboard;
