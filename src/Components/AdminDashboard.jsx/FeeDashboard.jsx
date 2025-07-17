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
import { FaGraduationCap, FaMoneyBillWave } from "react-icons/fa";
import { MdCalendarToday } from "react-icons/md";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  createFee,
  updateFee,
  getAllStudents,
  getAllFees,
} from "../../supabaseConfig/supabaseApi";
import Select from "react-select";

const COLORS = ["#A5D8FF", "#FBC7C7", "#666"];

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

  useEffect(() => {
    // Fetch students and real fees from DB
    const fetchData = async () => {
      const studentsData = await getAllStudents();
      setStudents(studentsData || []);
      const feesData = await getAllFees();
      setFees(feesData || []);
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

  const getStatus = (fee) => {
    if (fee.paid_amount >= fee.amount) return "paid";
    if (fee.paid_amount > 0 && fee.paid_amount < fee.amount) return "partial";
    if (fee.paid_amount === 0 && new Date(fee.due_date) < new Date())
      return "overdue";
    return "unpaid";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
    { name: "Paid", value: fees.filter((f) => getStatus(f) === "paid").length },
    {
      name: "Partially",
      value: fees.filter((f) => getStatus(f) === "partial").length,
    },
    {
      name: "Unpaid",
      value: fees.filter((f) => getStatus(f) === "unpaid").length,
    },
    {
      name: "Overdue",
      value: fees.filter((f) => getStatus(f) === "overdue").length,
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
    .filter((f) => getStatus(f) === "overdue")
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
    if (editIndex !== null) {
      // Edit: update in database
      const feeId = fees[editIndex].id;
      const { error } = await updateFee(feeId, form);
      if (error) {
        alert("Failed to update fee: " + error.message);
        return;
      }
    } else {
      // Add: insert into database
      const { error } = await createFee(form);
      if (error) {
        alert("Failed to add fee: " + error.message);
        return;
      }
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
        getStatus(fee).toUpperCase(),
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

  // Filtered fees: only include those with a matching student
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
    return nameMatch && yearMatch && maxDueMatch;
  });

  const statusData = [
    { name: "Paid", value: fees.filter((f) => getStatus(f) === "paid").length },
    {
      name: "Partial",
      value: fees.filter((f) => getStatus(f) === "partial").length,
    },
    {
      name: "Unpaid",
      value: fees.filter((f) => getStatus(f) === "unpaid").length,
    },
    {
      name: "Overdue",
      value: fees.filter((f) => getStatus(f) === "overdue").length,
    },
  ];
  const pieColors = ["#34d399", "#fbbf24", "#60a5fa", "#ef4444"];

  return (
    <div className="min-h-screen bg-white text-gray-500 p-6">
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
        <div className="flex gap-2 mt-4 md:mt-0">
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
        </div>
      </div>
      {/* Table */}
      <div className="bg-[#EEF0FD] text-black p-4 rounded overflow-auto mb-8">
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
              const status = getStatus(fee);
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
                    {student
                      ? `${student.first_name} ${student.middle_name ?? ""} ${
                          student.last_name
                        }`.trim()
                      : "-"}
                  </td>
                  <td className="p-2">{student ? student.year : "-"}</td>
                  <td className="p-2">{fee.amount}</td>
                  <td className="p-2">{fee.paid_amount}</td>
                  <td className="p-2">{fee.due_date}</td>
                  <td className="p-2">{fee.paid_date}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        status
                      )}`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">{fee.notes}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleOpenModal(idx)}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative mx-2">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {editIndex !== null ? "Edit Fee" : "Add Fee"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Student
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  Due Date
                </label>
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
                  value={form.paid_amount}
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
                  value={form.paid_date}
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
          </div>
        </div>
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
