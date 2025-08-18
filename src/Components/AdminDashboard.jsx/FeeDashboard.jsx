import React, { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAllFees, getAllStudents } from "../../supabaseConfig/supabaseApi";

function FeeDashboard() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [feesData, studentsData] = await Promise.all([
          getAllFees(),
          getAllStudents(),
        ]);
        if (!isMounted) return;
        setFees(Array.isArray(feesData) ? feesData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      } catch (err) {
        if (!isMounted) return;
        setError("Failed to load fee data");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const studentMap = useMemo(() => {
    const map = new Map();
    for (const s of students) {
      map.set(s.id, s);
    }
    return map;
  }, [students]);

  const memoizedData = useMemo(() => {
    return {
      filteredFees: fees,
    };
  }, [fees]);

  const handleExportPdf = useCallback(() => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    doc.setFontSize(24);
    doc.setTextColor(30, 68, 157);
    doc.text("Fee Management Report", 40, 40);

    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);

    let startY = 80;

    doc.setFontSize(16);
    doc.setTextColor(30, 68, 157);
    doc.text("Summary Statistics", 40, startY);
    startY += 20;

    const totalCount = memoizedData.filteredFees.length;
    const paidCount = memoizedData.filteredFees.filter((f) => f.status === "paid").length;
    const unpaidCount = memoizedData.filteredFees.filter((f) => f.status === "unpaid").length;
    const overdueCount = memoizedData.filteredFees.filter((f) => f.status === "overdue").length;
    const partialCount = memoizedData.filteredFees.filter((f) => f.status === "partial").length;
    const totalDue = memoizedData.filteredFees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const totalCollected = memoizedData.filteredFees.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
    const totalOutstanding = Math.max(0, totalDue - totalCollected);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Records: ${totalCount}`, 40, startY);
    startY += 15;
    doc.text(`Paid: ${paidCount}`, 40, startY);
    startY += 15;
    doc.text(`Unpaid: ${unpaidCount}`, 40, startY);
    startY += 15;
    doc.text(`Overdue: ${overdueCount}`, 40, startY);
    startY += 15;
    doc.text(`Partial: ${partialCount}`, 40, startY);
    startY += 15;
    doc.text(`Total Due: Rs ${totalDue.toLocaleString()}`, 40, startY);
    startY += 15;
    doc.text(`Total Collected: Rs ${totalCollected.toLocaleString()}`, 40, startY);
    startY += 15;
    doc.text(`Outstanding: Rs ${totalOutstanding.toLocaleString()}`, 40, startY);
    startY += 30;

    doc.setFontSize(16);
    doc.setTextColor(30, 68, 157);
    doc.text("Detailed Fee Report", 40, startY);
    startY += 20;

    const tableData = memoizedData.filteredFees.map((fee) => {
      const student = studentMap.get(fee.student_id);
      const studentName = student ? `${student.first_name} ${student.last_name}` : String(fee.student_id || "-");
      const year = student ? student.year : "-";

      return [
        studentName,
        year,
        `Rs ${Number(fee.amount || 0).toLocaleString()}`,
        fee.due_date ? new Date(fee.due_date).toLocaleDateString() : "-",
        fee.paid_amount ? `Rs ${Number(fee.paid_amount).toLocaleString()}` : "-",
        fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "-",
        (fee.status || "-").toString().toUpperCase(),
        fee.notes || "-",
      ];
    });

    autoTable(doc, {
      startY,
      head: [["Student", "Year", "Amount", "Due Date", "Paid", "Paid Date", "Status", "Notes"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 68, 157],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 140, halign: 'left' },
        1: { cellWidth: 50 },
        2: { cellWidth: 80 },
        3: { cellWidth: 80 },
        4: { cellWidth: 80 },
        5: { cellWidth: 80 },
        6: { cellWidth: 60, fontStyle: 'bold' },
        7: { cellWidth: 120, halign: 'left' },
      },
      margin: { left: 40, right: 40 },
      didDrawPage: function (data) {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save("fee-management-report.pdf");
  }, [memoizedData.filteredFees, studentMap]);

  return (
    <div className="min-h-screen border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-700 p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <button
          onClick={handleExportPdf}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading fees...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : memoizedData.filteredFees.length === 0 ? (
        <div className="text-gray-500">No fee records found.</div>
      ) : (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-2">Student</th>
                <th className="p-2">Year</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Due Date</th>
                <th className="p-2">Paid</th>
                <th className="p-2">Paid Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {memoizedData.filteredFees.map((fee) => {
                const student = studentMap.get(fee.student_id);
                const studentName = student
                  ? `${student.first_name} ${student.last_name}`
                  : String(fee.student_id || "-");
                const year = student ? student.year : "-";
                return (
                  <tr key={fee.id} className="border-b last:border-0">
                    <td className="p-2">{studentName}</td>
                    <td className="p-2">{year}</td>
                    <td className="p-2">Rs {Number(fee.amount || 0).toLocaleString()}</td>
                    <td className="p-2">{fee.due_date ? new Date(fee.due_date).toLocaleDateString() : "-"}</td>
                    <td className="p-2">{fee.paid_amount ? `Rs ${Number(fee.paid_amount).toLocaleString()}` : "-"}</td>
                    <td className="p-2">{fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "-"}</td>
                    <td className="p-2 uppercase">{fee.status || "-"}</td>
                    <td className="p-2">{fee.notes || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FeeDashboard;