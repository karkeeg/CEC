import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  CartesianGrid,
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
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Loader from "../Loader";

const COLORS = ["#A5D8FF", "#FBC7C7", "#666"];

// Status enums/constants
const FEE_STATUS = {
  PAID: "paid",
  PARTIAL: "partial",
  OVERDUE: "overdue",
  UNPAID: "unpaid",
};

const FeeDashboard = () => {
  // Auto-calculate status based on payment data
  const calculateStatus = useCallback((amount, paidAmount, dueDate) => {
    const totalAmount = Number(amount) || 0;
    const paid = Number(paidAmount) || 0;
    const due = new Date(dueDate);
    const today = new Date();

    if (paid >= totalAmount && totalAmount > 0) {
      return "paid";
    } else if (paid > 0 && paid < totalAmount) {
      return "partial";
    } else if (paid === 0 || paidAmount === null || paidAmount === undefined) {
      if (totalAmount > 0 && due < today) {
        return "overdue";
      } else {
        return "unpaid";
      }
    }
    return "unpaid";
  }, []);

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
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFees, setLoadingFees] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueDisplayCount, setOverdueDisplayCount] = useState(7);

  // Memoized student lookup map for better performance
  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach((student) => {
      map.set(student.id, student);
    });
    return map;
  }, [students]);

  // Memoized getStudentName function
  const getStudentName = useCallback(
    (id) => {
      const student = studentMap.get(id);
      return student
        ? `${student.first_name} ${student.middle_name ?? ""} ${
            student.last_name
          }`.trim()
        : id;
    },
    [studentMap]
  );

  // Function to group fees by student
  const groupFeesByStudent = useCallback((fees) => {
    const grouped = fees.reduce((acc, fee) => {
      const student = studentMap.get(fee.student_id);
      if (!student) return acc;
      
      const key = `${fee.student_id}-${student.year}`;
      
      if (!acc[key]) {
        acc[key] = {
          student_id: fee.student_id,
          student_name: `${student.first_name} ${student.last_name}`,
          year: student.year,
          totalAmount: 0,
          totalPaidAmount: 0,
          fees: [],
          overallStatus: 'paid'
        };
      }
      
      acc[key].totalAmount += Number(fee.amount);
      acc[key].totalPaidAmount += Number(fee.paid_amount || 0);
      acc[key].fees.push(fee);
      
      if (fee.status === 'overdue' || fee.status === 'unpaid') {
        acc[key].overallStatus = fee.status;
      } else if (fee.status === 'partial' && acc[key].overallStatus === 'paid') {
        acc[key].overallStatus = 'partial';
      }
      
      return acc;
    }, {});
    
    return Object.values(grouped);
  }, [studentMap]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStudents(true);
      setLoadingFees(true);
      setError("");
      try {
        const [studentsData, feesData] = await Promise.all([
          getAllStudents(),
          getAllFees(),
        ]);

        setStudents(studentsData || []);
        setFees(feesData || []);

        if (feesData && feesData.length > 0) {
          await fixStatusMismatches(feesData);
        }
      } catch (e) {
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoadingStudents(false);
        setLoadingFees(false);
      }
    };
    fetchData();
  }, []);

  // Function to fix status mismatches in database
  const fixStatusMismatches = useCallback(
    async (feesData) => {
      const mismatches = [];

      for (const fee of feesData) {
        const calculatedStatus = calculateStatus(
          fee.amount,
          fee.paid_amount,
          fee.due_date
        );
        if (calculatedStatus !== fee.status) {
          mismatches.push({
            feeId: fee.id,
            oldStatus: fee.status,
            newStatus: calculatedStatus,
            studentName: getStudentName(fee.student_id),
          });
        }
      }

      if (mismatches.length > 0) {
        console.log(
          `Found ${mismatches.length} status mismatches:`,
          mismatches
        );

        const updatePromises = mismatches.map(async (mismatch) => {
          try {
            await updateFee(mismatch.feeId, { status: mismatch.newStatus });
            console.log(
              `Fixed status for ${mismatch.studentName}: ${mismatch.oldStatus} → ${mismatch.newStatus}`
            );
          } catch (error) {
            console.error(
              `Failed to update status for fee ${mismatch.feeId}:`,
              error
            );
          }
        });

        await Promise.all(updatePromises);

        const updatedFees = await getAllFees();
        setFees(updatedFees || []);
      }
    },
    [calculateStatus, getStudentName]
  );

  // Memoized data calculations
  const memoizedData = useMemo(() => {
    if (!fees.length || !students.length) {
      return {
        dataSummary: [],
        totalDue: 0,
        totalPaid: 0,
        barData: [],
        yearGroups: [],
        overdueFees: [],
        displayedOverdueFees: [],
        topDebtors: [],
        summary: { totalDue: 0, totalPaid: 0, overdue: 0, unpaid: 0 },
        statusData: [],
        filteredFees: [],
      };
    }

    const dataSummary = [
      { name: "Paid", value: fees.filter((f) => f.status === "paid").length },
      {
        name: "Partial",
        value: fees.filter((f) => f.status === "partial").length,
      },
      {
        name: "Unpaid",
        value: fees.filter((f) => f.status === "unpaid").length,
      },
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
        const student = studentMap.get(fee.student_id);
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

    const overdueFees = fees
      .filter((f) => f.status === "overdue")
      .map((fee) => {
        const student = studentMap.get(fee.student_id);
        return {
          name: getStudentName(fee.student_id),
          year: student ? student.year : "-",
          due: fee.amount - (fee.paid_amount || 0),
          due_date: fee.due_date,
        };
      })
      .sort((a, b) => b.due - a.due);

    const displayedOverdueFees = overdueFees.slice(0, overdueDisplayCount);

    const topDebtors = fees
      .filter((f) => {
        return (
          f.status === "unpaid" ||
          f.status === "overdue" ||
          f.status === "partial"
        );
      })
      .map((fee) => {
        const student = studentMap.get(fee.student_id);
        return {
          name: getStudentName(fee.student_id),
          year: student ? student.year : "-",
          due: fee.amount - (fee.paid_amount || 0),
        };
      })
      .sort((a, b) => b.due - a.due)
      .slice(0, 5);

    const summary = {
      totalDue,
      totalPaid,
      overdue: fees.filter((f) => f.status === "overdue").length,
      unpaid: fees.filter((f) => f.status === "unpaid").length,
    };

    const statusData = [
      { name: "Paid", value: fees.filter((f) => f.status === "paid").length },
      {
        name: "Partial",
        value: fees.filter((f) => f.status === "partial").length,
      },
      {
        name: "Unpaid",
        value: fees.filter((f) => f.status === "unpaid").length,
      },
      {
        name: "Overdue",
        value: fees.filter((f) => f.status === "overdue").length,
      },
    ];

    // Filtered fees calculation
    const filteredFees = fees.filter((fee) => {
      const student = studentMap.get(fee.student_id);
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

    return {
      dataSummary,
      totalDue,
      totalPaid,
      barData,
      yearGroups,
      overdueFees,
      displayedOverdueFees,
      topDebtors,
      summary,
      statusData,
      filteredFees,
    };
  }, [
    fees,
    students,
    studentMap,
    getStudentName,
    searchTerm,
    filterYear,
    maxDue,
    statusFilter,
    overdueDisplayCount,
  ]);

  // Component for expandable grouped fee table
  const GroupedFeeTable = ({ fees }) => {
    const [expandedStudents, setExpandedStudents] = useState(new Set());
    const groupedFees = groupFeesByStudent(fees);
    
    const toggleExpanded = (studentKey) => {
      const newExpanded = new Set(expandedStudents);
      if (newExpanded.has(studentKey)) {
        newExpanded.delete(studentKey);
      } else {
        newExpanded.add(studentKey);
      }
      setExpandedStudents(newExpanded);
    };
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Student Fee Summary ({groupedFees.length} students)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left"></th>
                <th className="px-4 py-2 text-left">Student</th>
                <th className="px-4 py-2 text-left">Year</th>
                <th className="px-4 py-2 text-left">Total Amount</th>
                <th className="px-4 py-2 text-left">Total Paid</th>
                <th className="px-4 py-2 text-left">Balance</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <tbody>
              {groupedFees.map((studentFee) => {
                const studentKey = `${studentFee.student_id}-${studentFee.year}`;
                const isExpanded = expandedStudents.has(studentKey);
                const balance = studentFee.totalAmount - studentFee.totalPaidAmount;
                
                return (
                  <React.Fragment key={studentKey}>
                    {/* Main student row */}
                    <tr className="border-b hover:bg-gray-50 bg-blue-50">
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleExpanded(studentKey)}
                          className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {studentFee.student_name}
                      </td>
                      <td className="px-4 py-2">{studentFee.year}</td>
                      <td className="px-4 py-2 font-semibold">
                        Rs. {studentFee.totalAmount}
                      </td>
                      <td className="px-4 py-2 text-green-600 font-semibold">
                        Rs. {studentFee.totalPaidAmount}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          Rs. {balance}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            studentFee.overallStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : studentFee.overallStatus === "partial"
                              ? "bg-yellow-100 text-yellow-800"
                              : studentFee.overallStatus === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {studentFee.overallStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleExpanded(studentKey)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {isExpanded ? 'Hide Details' : `View ${studentFee.fees.length} Fees`}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded fee details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="8" className="p-0">
                          <div className="bg-gray-100 px-4 py-2">
                            <div className="font-semibold text-gray-700">
                              Fee Details for {studentFee.student_name}: ({studentFee.fees.length} fees)
                            </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            <table className="min-w-full">
                              <tbody>
                                {studentFee.fees.map((fee, feeIndex) => (
                                  <tr key={fee.id || feeIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                    <td className="px-4 py-2 w-8"></td>
                                    <td className="px-4 py-2 text-sm pl-8">
                                      Fee #{feeIndex + 1}
                                      {fee.notes && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {fee.notes}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      Due: {fee.due_date}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      Rs. {fee.amount}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {fee.paid_amount ? `Rs. ${fee.paid_amount}` : '-'}
                                      {fee.paid_date && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Paid: {fee.paid_date}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      Rs. {fee.amount - (fee.paid_amount || 0)}
                                    </td>
                                    <td className="px-4 py-2">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                          fee.status === "paid"
                                            ? "bg-green-100 text-green-800"
                                            : fee.status === "partial"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : fee.status === "overdue"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {fee.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            const feeIndex = fees.findIndex(f => f.id === fee.id);
                                            handleOpenModal(feeIndex);
                                          }}
                                          className="text-blue-600 hover:text-blue-800 text-sm"
                                          title="Edit Fee"
                                        >
                                          <FaEdit />
                                        </button>
                                        <button
                                          onClick={() => {
                                            const feeIndex = fees.findIndex(f => f.id === fee.id);
                                            handleDelete(feeIndex);
                                          }}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                          title="Delete Fee"
                                        >
                                          <FaTrash />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
        
        {groupedFees.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            No fee records found.
          </div>
        )}
      </div>
    );
  };

  const handleOpenModal = useCallback(
    (idx = null) => {
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
    },
    [fees]
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.student_id || !form.amount || !form.due_date) {
        alert("Student, amount, and due date are required.");
        return;
      }

      const calculatedStatus = calculateStatus(
        form.amount,
        form.paid_amount,
        form.due_date
      );

      const feeData = {
        ...form,
        paid_amount:
          form.paid_amount === "" || form.paid_amount == null
            ? null
            : Number(form.paid_amount),
        paid_date:
          form.paid_date === "" || form.paid_date == null
            ? null
            : form.paid_date,
        status: calculatedStatus,
      };

      let isPayment = false;
      if (editIndex !== null) {
        const feeId = fees[editIndex].id;
        const { error } = await updateFee(feeId, feeData);
        if (error) {
          alert("Failed to update fee: " + error.message);
          return;
        }
        const prevPaid = fees[editIndex].paid_amount || 0;
        if (feeData.paid_amount && Number(feeData.paid_amount) > prevPaid) {
          isPayment = true;
        }
      } else {
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
        const student = studentMap.get(form.student_id);
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

      const feesData = await getAllFees();
      setFees(feesData || []);
      setShowModal(false);
      setForm({
        student_id: "",
        amount: "",
        due_date: "",
        paid_date: "",
        paid_amount: "",
        status: "unpaid",
        notes: "",
      });
      setEditIndex(null);
    },
    [form, editIndex, fees, calculateStatus, studentMap]
  );

  const exportToPDF = useCallback(() => {
    const element = document.getElementById("fee-dashboard");
    const opt = {
      margin: 1,
      filename: "fee-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  }, []);

  const handleDelete = useCallback(
    async (idx) => {
      if (window.confirm("Are you sure you want to delete this fee?")) {
        const feeId = fees[idx].id;
        const { error } = await updateFee(feeId, { status: "deleted" });
        if (error) {
          alert("Failed to delete fee: " + error.message);
          return;
        }
        const updatedFees = fees.filter((_, i) => i !== idx);
        setFees(updatedFees);
      }
    },
    [fees]
  );

  const exportToCSV = useCallback(() => {
    const headers = [
      "Student Name",
      "Year",
      "Amount",
      "Due Date",
      "Paid Amount",
      "Paid Date",
      "Status",
      "Notes",
    ];
    const csvData = memoizedData.filteredFees.map((fee) => {
      const student = studentMap.get(fee.student_id);
      return [
        student ? `${student.first_name} ${student.last_name}` : fee.student_id,
        student ? student.year : "-",
        fee.amount,
        fee.due_date,
        fee.paid_amount || 0,
        fee.paid_date || "",
        fee.status,
        fee.notes || "",
      ];
    });
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [memoizedData.filteredFees, studentMap]);

  const pieColors = ["#34d399", "#fbbf24", "#60a5fa", "#ef4444"];

  if (loadingStudents || loadingFees) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Loading fee dashboard data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="fee-dashboard"
      className="min-h-screen border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-500 p-6"
    >
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
            {memoizedData.summary.totalDue}
          </div>
          <div className="text-gray-600">Total Due</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-green-700">
            {memoizedData.summary.totalPaid}
          </div>
          <div className="text-gray-600">Total Paid</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-red-700">
            {memoizedData.summary.overdue}
          </div>
          <div className="text-gray-600"># Overdue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-yellow-700">
            {memoizedData.summary.unpaid}
          </div>
          <div className="text-gray-600"># Unpaid</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
          <input
            type="number"
            placeholder="Max due amount..."
            value={maxDue}
            onChange={(e) => setMaxDue(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Grouped Fees Table */}
      <GroupedFeeTable fees={memoizedData.filteredFees} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
        {/* Fee Status Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            Fee Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={memoizedData.statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {memoizedData.statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Collection vs Due */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            Fee Collection vs Due
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memoizedData.barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Fees Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-yellow-600">Overdue Fees</h3>
          <div className="flex gap-2">
            {memoizedData.overdueFees.length > 7 && (
              <>
                <button
                  onClick={() =>
                    setOverdueDisplayCount((prev) => Math.max(7, prev - 5))
                  }
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  Show Less (-5)
                </button>
                <button
                  onClick={() => setOverdueDisplayCount((prev) => prev + 5)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  Show More (+5)
                </button>
              </>
            )}
          </div>
        </div>
        {memoizedData.displayedOverdueFees.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No overdue fees.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-left">Amount Due</th>
                  <th className="px-4 py-2 text-left">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {memoizedData.displayedOverdueFees.map((fee, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{fee.name}</td>
                    <td className="px-4 py-2">{fee.year}</td>
                    <td className="px-4 py-2 font-semibold text-red-600">
                      Rs. {fee.due}
                    </td>
                    <td className="px-4 py-2">{fee.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Debtors Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-yellow-600">Top Debtors</h3>
        {memoizedData.topDebtors.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No debtors found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-left">Amount Due</th>
                </tr>
              </thead>
              <tbody>
                {memoizedData.topDebtors.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2">{row.year}</td>
                    <td className="px-4 py-2 font-semibold text-red-600">
                      Rs. {row.due}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editIndex !== null ? "Edit Fee" : "Add New Fee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Student
                </label>
                <Select
                  value={
                    form.student_id
                      ? {
                          value: form.student_id,
                          label: getStudentName(form.student_id),
                        }
                      : null
                  }
                  onChange={(option) =>
                    setForm((prev) => ({
                      ...prev,
                      student_id: option?.value || "",
                    }))
                  }
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.first_name} ${s.last_name} (Year ${s.year})`,
                  }))}
                  placeholder="Select student..."
                  isSearchable
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
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
                  type="date"
                  name="due_date"
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
                  type="number"
                  name="paid_amount"
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
                  type="date"
                  name="paid_date"
                  value={form.paid_date}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                />
              </div>
              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editIndex !== null ? "Update" : "Add"} Fee
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FeeDashboard;