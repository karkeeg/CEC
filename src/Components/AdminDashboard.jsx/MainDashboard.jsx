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
    semester: "",
    reg_no: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      "first_name",
      "last_name",
      "dob",
      "address",
      "semester",
      "reg_no",
    ];
    if (required.some((field) => !form[field])) {
      alert("Please fill all required fields.");
      return;
    }

    const { error } = await supabase.from("students").insert([form]);
    if (error) {
      alert("Failed to add student.");
    } else {
      alert("Student added!");
      onClose();
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
        name="semester"
        placeholder="Semester*"
        className={inputStyle}
        value={form.semester}
        onChange={handleChange}
      />
      <input
        name="reg_no"
        placeholder="Registration No*"
        className={inputStyle}
        value={form.reg_no}
        onChange={handleChange}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ["first_name", "last_name", "email", "phone"];
    if (required.some((f) => !form[f])) {
      alert("Please fill all required fields.");
      return;
    }

    const { error } = await supabase.from("teachers").insert([form]);
    if (error) {
      alert("Failed to add teacher.");
    } else {
      alert("Teacher added!");
      onClose();
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
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
    </form>
  );
};

const NoticeForm = ({ onClose }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: "All",
    publish_date: "",
    expiry_date: "",
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, description, publish_date } = form;
    if (!title || !description || !publish_date) {
      alert("Please fill in all required fields.");
      return;
    }

    let fileURL = null;

    if (file) {
      try {
        setUploading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from("notices")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("notices")
          .getPublicUrl(fileName);
        fileURL = publicUrlData.publicUrl;
      } catch (err) {
        alert("File upload failed");
        console.error(err);
        return;
      } finally {
        setUploading(false);
      }
    }

    const { error } = await supabase.from("notifications").insert([
      {
        ...form,
        file_url: fileURL,
      },
    ]);

    if (error) {
      alert("Failed to publish notice.");
      console.error(error);
    } else {
      alert("Notice published!");
      onClose();
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
      <select
        name="audience"
        className={inputStyle}
        value={form.audience}
        onChange={handleChange}
      >
        <option>All</option>
        <option>Teachers</option>
        <option>Students</option>
      </select>

      <label className="text-sm font-medium text-gray-700">Attach File</label>
      <input type="file" onChange={handleFileChange} className={inputStyle} />

      <label className="text-sm font-medium text-gray-700">Publish Date*</label>
      <input
        type="date"
        name="publish_date"
        className={inputStyle}
        value={form.publish_date}
        onChange={handleChange}
      />

      <label className="text-sm font-medium text-gray-700">Expiry Date</label>
      <input
        type="date"
        name="expiry_date"
        className={inputStyle}
        value={form.expiry_date}
        onChange={handleChange}
      />

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 rounded text-white ${
            uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
          }`}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Publish"}
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
    <div className="ml-64 p-6 bg-gray-50 min-h-screen">
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
    </div>
  );
};

export default MainDashboard;
