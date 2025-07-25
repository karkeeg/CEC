import React, { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  FaGraduationCap,
  FaMoneyBillWave,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { MdCalendarToday } from "react-icons/md";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  createFee,
  updateFee,
  getAllStudents,
  getAllFees,
  logActivity,
} from "../../supabaseConfig/supabaseApi";
import Select from "react-select";
import Modal from "../Modal";

const COLORS = ["#A5D8FF", "#FBC7C7", "#666"];

// 1. Status enums/constants
const FEE_STATUS = {
  PAID: "paid",
  PARTIAL: "partial",
  OVERDUE: "overdue",
  UNPAID: "unpaid",
};

const FeeDashboard = () => {
  const [form, setForm] = useState({
    student_id: "",
    amount: "",
    due_date: "",
    paid_date: "",
    paid_amount: "",
    status: "unpaid",
    notes: "",
  });

  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [maxDue, setMaxDue] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFees, setLoadingFees] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStudents(true);
      setLoadingFees(true);
      setError("");
      try {
        const studentsData = await getAllStudents();
        setStudents(studentsData || []);
      } catch (e) {
        setError("Failed to fetch students. Please try again later.");
      } finally {
        setLoadingStudents(false);
      }
      try {
        const feesData = await getAllFees();
        setFees(feesData || []);
      } catch (e) {
        setError("Failed to fetch fees. Please try again later.");
      } finally {
        setLoadingFees(false);
      }
    };
    fetchData();
  }, []);
  console.log(students, fees);

  const getStudentName = (id) => {
    const s = students.find((stu) => stu.id === id);
    return s
      ? `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`.trim()
      : id;
  };

  const handleOpenModal = (idx = null) => {
    setEditIndex(idx);
    if (idx !== null) {
      setForm(fees[idx]);
    } else {
      setForm({
        student_id: "",
        amount: "",
        due_date: "",
        paid_date: "",
        paid_amount: "",
        status: "unpaid",
        notes: "",
      });
    }
    setShowModal(true);
  };

  const dataSummary = [
    { name: "Paid", value: fees.filter((f) => f.status === "paid").length },
    {
      name: "Partially",
      value: fees.filter((f) => f.status === "partial").length,
    },
    { name: "Unpaid", value: fees.filter((f) => f.status === "unpaid").length },
    {
      name: "Overdue",
      value: fees.filter((f) => f.status === "overdue").length,
    },
  ];

  const totalDue = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = fees.reduce(
    (sum, f) => sum + Number(f.paid_amount || 0),
    0
  );
  const barData = [
    { name: "Total Due", value: totalDue },
    { name: "Total Paid", value: totalPaid },
  ];

  const yearGroups = [1, 2, 3, 4].map((year) => {
    const yearFees = fees.filter((fee) => {
      const student = students.find((s) => s.id === fee.student_id);
      return student && String(student.year) === String(year);
    });
    return {
      year: String(year),
      totalDue: yearFees.reduce((sum, f) => sum + Number(f.amount), 0),
      totalPaid: yearFees.reduce(
        (sum, f) => sum + Number(f.paid_amount || 0),
        0
      ),
    };
  });

  // Overdue Fees Table
  const overdueFees = fees
    .filter((f) => f.status === "overdue")
    .map((fee) => {
      const student = students.find((s) => s.id === fee.student_id);
      return {
        name: getStudentName(fee.student_id),
        year: student ? student.year : "-",
        due: fee.amount - (fee.paid_amount || 0),
        due_date: fee.due_date,
      };
    });

  // Top Debtors Table
  const topDebtors = fees
    .map((fee) => {
      const student = students.find((s) => s.id === fee.student_id);
      return {
        name: getStudentName(fee.student_id),
        year: student ? student.year : "-",
        due: fee.amount - (fee.paid_amount || 0),
      };
    })
    .sort((a, b) => b.due - a.due)
    .slice(0, 5);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.amount || !form.due_date) {
      alert("Student, amount, and due date are required.");
      return;
    }
    // Convert empty paid_amount and paid_date to null
    const feeData = {
      ...form,
      paid_amount:
        form.paid_amount === "" || form.paid_amount == null
          ? null
          : Number(form.paid_amount),
      paid_date:
        form.paid_date === "" || form.paid_date == null ? null : form.paid_date,
    };
    let isPayment = false;
    if (editIndex !== null) {
      // Edit: update in database
      const feeId = fees[editIndex].id;
      const { error } = await updateFee(feeId, feeData);
      if (error) {
        alert("Failed to update fee: " + error.message);
        return;
      }
      // If paid_amount is set and changed, log payment
      const prevPaid = fees[editIndex].paid_amount || 0;
      if (feeData.paid_amount && Number(feeData.paid_amount) > prevPaid) {
        isPayment = true;
      }
    } else {
      // Add: insert into database
      const { error } = await createFee(feeData);
      if (error) {
        alert("Failed to add fee: " + error.message);
        return;
      }
      if (feeData.paid_amount && Number(feeData.paid_amount) > 0) {
        isPayment = true;
      }
    }
    if (isPayment) {
      const student = students.find((s) => s.id === form.student_id);
      await logActivity(
        `Fee payment of Rs ${form.paid_amount} received from ${
          student
            ? student.first_name + " " + student.last_name
            : form.student_id
        }.`,
        "fee",
        typeof currentUser !== "undefined" ? currentUser : {}
      );
    }
    // Re-fetch fees from DB
    const feesData = await getAllFees();
    setFees(feesData || []);
    setShowModal(false);
    setEditIndex(null);
    setForm({
      student_id: "",
      amount: "",
      due_date: "",
      paid_date: "",
      paid_amount: "",
      status: "unpaid",
      notes: "",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Fee Report", 40, 40);
    autoTable(doc, {
      startY: 60,
      head: [["Student Name", "Due Amount", "Status"]],
      body: fees.map((fee) => [
        getStudentName(fee.student_id),
        fee.amount,
        fee.status.toUpperCase(),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    doc.save("fee-report.pdf");
  };

  // 2. Inline form validation and duplicate prevention
  const validateForm = () => {
    setFormError("");
    if (!form.student_id || !form.amount || !form.due_date) {
      setFormError("Student, amount, and due date are required.");
      return false;
    }
    if (Number(form.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return false;
    }
    if (form.paid_amount && Number(form.paid_amount) < 0) {
      setFormError("Paid amount cannot be negative.");
      return false;
    }
    if (form.paid_amount && Number(form.paid_amount) > Number(form.amount)) {
      setFormError("Paid amount cannot exceed total amount.");
      return false;
    }
    if (
      form.paid_date &&
      form.due_date &&
      new Date(form.paid_date) < new Date(form.due_date)
    ) {
      setFormError("Paid date cannot be before due date.");
      return false;
    }
    // Duplicate prevention (same student, same due_date)
    const duplicate = fees.some(
      (f, idx) =>
        f.student_id === form.student_id &&
        f.due_date === form.due_date &&
        (editIndex === null || idx !== editIndex)
    );
    if (duplicate) {
      setFormError("Duplicate fee entry for this student and due date.");
      return false;
    }
    return true;
  };

  // 3. Delete action with confirmation
  const handleDelete = async (idx) => {
    if (!window.confirm("Are you sure you want to delete this fee record?"))
      return;
    const feeId = fees[idx].id;
    try {
      const { error: delError } = await updateFee(feeId, { deleted: true }); // Soft delete if possible
      if (delError) throw delError;
      setFees(fees.filter((_, i) => i !== idx));
    } catch (e) {
      setError("Failed to delete fee. Please try again.");
    }
  };

  // 4. CSV export
  const exportToCSV = () => {
    const header = [
      "Student Name",
      "Year",
      "Total Amount",
      "Paid Amount",
      "Due Date",
      "Paid Date",
      "Status",
      "Notes",
    ];
    const rows = fees.map((fee) => {
      const student = students.find((s) => s.id === fee.student_id);
      return [
        student
          ? `${student.first_name} ${student.middle_name ?? ""} ${
              student.last_name
            }`.trim()
          : "-",
        student ? student.year : "-",
        fee.amount,
        fee.paid_amount,
        fee.due_date,
        fee.paid_date,
        fee.status.toUpperCase(),
        fee.notes,
      ];
    });
    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 5. Status filter
  const filteredFees = fees.filter((fee) => {
    const student = students.find((s) => s.id === fee.student_id);
    if (!student) return false;
    const nameMatch = `${student.first_name} ${student.middle_name ?? ""} ${
      student.last_name
    }`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const yearMatch = filterYear
      ? String(student.year) === String(filterYear)
      : true;
    const dueRemaining = fee.amount - (fee.paid_amount || 0);
    const maxDueMatch = maxDue ? dueRemaining <= Number(maxDue) : true;
    const statusMatch = statusFilter ? fee.status === statusFilter : true;
    return nameMatch && yearMatch && maxDueMatch && statusMatch;
  });

  // 6. Summary cards
  const summary = {
    totalDue: fees.reduce((sum, f) => sum + Number(f.amount), 0),
    totalPaid: fees.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0),
    overdue: fees.filter((f) => f.status === FEE_STATUS.OVERDUE).length,
    unpaid: fees.filter((f) => f.status === FEE_STATUS.UNPAID).length,
  };

  const statusData = [
    { name: "Paid", value: fees.filter((f) => f.status === "paid").length },
    {
      name: "Partial",
      value: fees.filter((f) => f.status === "partial").length,
    },
    { name: "Unpaid", value: fees.filter((f) => f.status === "unpaid").length },
    {
      name: "Overdue",
      value: fees.filter((f) => f.status === "overdue").length,
    },
  ];
  const pieColors = ["#34d399", "#fbbf24", "#60a5fa", "#ef4444"];

  return (
    <div className="min-h-screen 6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-500 p-6">
      {/* Heading and Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-blue-900">
          Admin Fee Dashboard
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 px-4 py-2 rounded shadow text-white hover:bg-blue-700"
          >
            Add Fee
          </button>
          <button
            onClick={exportToPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export PDF
          </button>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-blue-700">
            {summary.totalDue}
          </div>
          <div className="text-gray-600">Total Due</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-green-700">
            {summary.totalPaid}
          </div>
          <div className="text-gray-600">Total Paid</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-red-700">
            {summary.overdue}
          </div>
          <div className="text-gray-600"># Overdue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-yellow-700">
            {summary.unpaid}
          </div>
          <div className="text-gray-600"># Unpaid</div>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Search by Name
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded w-full min-w-[180px]"
            placeholder="Student Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Filter by Year
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border px-4 py-2 rounded w-full min-w-[120px]"
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Max Due Remaining
          </label>
          <input
            type="number"
            value={maxDue}
            onChange={(e) => setMaxDue(e.target.value)}
            className="border px-4 py-2 rounded w-full min-w-[120px]"
            placeholder="Amount"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-4 py-2 rounded w-full min-w-[120px]"
          >
            <option value="">All Statuses</option>
            <option value={FEE_STATUS.PAID}>Paid</option>
            <option value={FEE_STATUS.PARTIAL}>Partial</option>
            <option value={FEE_STATUS.UNPAID}>Unpaid</option>
            <option value={FEE_STATUS.OVERDUE}>Overdue</option>
          </select>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-semibold">
          {error}
        </div>
      )}
      {/* Table */}
      <div
        className="bg-[#EEF0FD] text-black p-4 rounded overflow-auto mb-8"
        style={{ maxHeight: "60vh" }}
      >
        <table className="w-full text-left">
          <thead className="bg-[#2C7489] text-white">
            <tr>
              <th className="p-2">Student Name</th>
              <th className="p-2">Year</th>
              <th className="p-2">Total Amount</th>
              <th className="p-2">Paid Amount</th>
              <th className="p-2">Due Date</th>
              <th className="p-2">Paid Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.map((fee, idx) => {
              const student = students.find((s) => s.id === fee.student_id);
              const status = fee.status;
              return (
                <tr
                  key={fee.id}
                  className={
                    idx === filteredFees.length - 1
                      ? "bg-indigo-200"
                      : "bg-cyan-100"
                  }
                >
                  <td className="p-2">
                    {student ? (
                      <a
                        href={student.profileUrl || "#"}
                        className="text-blue-700 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`${student.first_name} ${student.middle_name ?? ""} ${
                          student.last_name
                        }`.trim()}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2">{student ? student.year : "-"}</td>
                  <td className="p-2">{fee.amount}</td>
                  <td className="p-2">{fee.paid_amount}</td>
                  <td className="p-2">{fee.due_date}</td>
                  <td className="p-2">{fee.paid_date}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        status === "paid"
                          ? "bg-green-100 text-green-800"
                          : status === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : status === "overdue"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">{fee.notes}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleOpenModal(idx)}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Add/Edit Fee Modal */}
      {showModal && (
        <Modal
          title={editIndex !== null ? "Edit Fee" : "Add Fee"}
          onClose={() => setShowModal(false)}
        >
            {formError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-center font-semibold">
                {formError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!validateForm()) return;
                handleSubmit(e);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
              <label className="block text-sm font-medium mb-1">Student</label>
                <Select
                  options={students.map((stu) => ({
                    value: stu.id,
                    label: `${stu.first_name} ${stu.middle_name ?? ""} ${
                      stu.last_name
                    }`.trim(),
                  }))}
                  value={
                    students
                      .map((stu) => ({
                        value: stu.id,
                        label: `${stu.first_name} ${stu.middle_name ?? ""} ${
                          stu.last_name
                        }`.trim(),
                      }))
                      .find((opt) => opt.value === form.student_id) || null
                  }
                  onChange={(opt) =>
                    setForm((prev) => ({
                      ...prev,
                      student_id: opt ? opt.value : "",
                    }))
                  }
                  isClearable
                  isSearchable
                  placeholder="Search and select student..."
                  classNamePrefix="react-select"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Amount
                </label>
                <input
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  name="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Paid Amount
                </label>
                <input
                  name="paid_amount"
                  type="number"
                value={form.paid_amount || ""}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Paid Date
                </label>
                <input
                  name="paid_date"
                  type="date"
                value={form.paid_date || ""}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {editIndex !== null ? "Save" : "Add"}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {/* Pie Chart: Fee Collection Status */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4">Fee Collection Status</h3>
          <PieChart width={220} height={220}>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {statusData.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={pieColors[idx % pieColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        {/* Bar Chart: Total Due vs. Total Collected */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4">
            Total Due vs. Total Collected
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Bar Chart: Fees by Year */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4">Fees by Year</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearGroups}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalDue" fill="#f59e42" name="Total Due" />
              <Bar dataKey="totalPaid" fill="#10b981" name="Total Paid" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Overdue Fees Table */}
      <div className="bg-white rounded-lg shadow p-6 mt-10">
        <h3 className="text-lg font-bold mb-4 text-red-600">Overdue Fees</h3>
        {overdueFees.length === 0 ? (
          <p className="text-gray-500">No overdue fees.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-red-100">
              <tr>
                <th className="p-2">Student Name</th>
                <th className="p-2">Year</th>
                <th className="p-2">Due Remaining</th>
                <th className="p-2">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {overdueFees.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.year}</td>
                  <td className="p-2">{row.due}</td>
                  <td className="p-2">{row.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Top Debtors Table */}
      <div className="bg-white rounded-lg shadow p-6 mt-10">
        <h3 className="text-lg font-bold mb-4 text-yellow-600">Top Debtors</h3>
        {topDebtors.length === 0 ? (
          <p className="text-gray-500">No debtors.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-yellow-100">
              <tr>
                <th className="p-2">Student Name</th>
                <th className="p-2">Year</th>
                <th className="p-2">Due Remaining</th>
              </tr>
            </thead>
            <tbody>
              {topDebtors.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.year}</td>
                  <td className="p-2">{row.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FeeDashboard;
