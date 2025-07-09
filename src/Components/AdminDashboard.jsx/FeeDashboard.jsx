import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { FaGraduationCap, FaMoneyBillWave } from "react-icons/fa";
import { MdCalendarToday } from "react-icons/md";

const COLORS = ["#A5D8FF", "#FBC7C7", "#666"];

const FeeDashboard = () => {
  const [form, setForm] = useState({
    name: "",
    due: "",
    paid: "",
    date: "",
    notes: "",
    status: "",
  });

  const [fees, setFees] = useState([
    { name: "Jhon", due: 10000, status: "Paid" },
    { name: "Ram", due: 20000, status: "Unpaid" },
    { name: "Sita", due: 100000, status: "Partial" },
    { name: "Sita", due: 30000, status: "Hold" },
  ]);

  const dataSummary = [
    { name: "Paid", value: fees.filter((f) => f.status === "Paid").length },
    {
      name: "Partially",
      value: fees.filter((f) => f.status === "Partial").length,
    },
    { name: "Unpaid", value: fees.filter((f) => f.status === "Unpaid").length },
  ];

  const totalStudents = fees.length;
  const totalDue = fees.reduce((acc, fee) => acc + parseInt(fee.due), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.due || !form.status)
      return alert("Fill required fields");
    setFees((prev) => [
      ...prev,
      { name: form.name, due: form.due, status: form.status },
    ]);
    setForm({ name: "", due: "", paid: "", date: "", notes: "", status: "" });
  };

  return (
    <div className="ml-64 min-h-screen bg-white text-gray-500 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fee</h1>
        <button className="bg-blue-600 px-4 py-2 rounded shadow text-white hover:bg-blue-700">
          Export PDF
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Cards - vertical */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <div className="bg-[#24B9C4] text-center p-12 rounded text-black">
              <p className="font-semibold text-2xl ">Total Students</p>
              <FaGraduationCap className="mx-auto text-6xl mb-2" />
              <h2 className="text-2xl font-bold">
                {totalStudents.toLocaleString()}
              </h2>
            </div>

            <div className="border border-[#24B9C4] text-center p-12 rounded text-cyan-300">
              <p className="font-semibold text-xl">Total Due Amount</p>
              <FaMoneyBillWave className="mx-auto text-4xl m-2" />
              <h2 className="text-2xl font-bold">
                Nrs. {totalDue.toLocaleString()}
              </h2>
            </div>

            <div className="border border-[#24B9C4] p-6 rounded text-black bg-white">
              <h3 className="font-semibold text-center text-[#24B9C4] mb-4">
                Pie Chart
              </h3>
              <PieChart width={180} height={180}>
                <Pie
                  data={dataSummary}
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {dataSummary.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#EEF0FD] text-black p-4 rounded overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-[#2C7489] text-white">
                <tr>
                  <th className="p-2">Student Name</th>
                  <th className="p-2">Due Amount</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx === fees.length - 1 ? "bg-indigo-200" : "bg-cyan-100"
                    }
                  >
                    <td className="p-2">{fee.name}</td>
                    <td className="p-2">{fee.due}</td>
                    <td className="p-2">{fee.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="lg:w-[30%] border border-[#24B9C4] p-6 rounded bg-[#EEF0FD] text-black h-full self-stretch">
          <h3 className="font-bold mb-4">Add Fee Record</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select
              name="name"
              value={form.name}
              onChange={handleChange}
              className="p-2 rounded"
            >
              <option value="">Student Name</option>
              <option>Jhon</option>
              <option>Ram</option>
              <option>Sita</option>
            </select>
            <input
              type="number"
              name="due"
              placeholder="Due Amount"
              value={form.due}
              onChange={handleChange}
              className="p-2 rounded"
            />
            <input
              type="number"
              name="paid"
              placeholder="Amount Paid"
              value={form.paid}
              onChange={handleChange}
              className="p-2 rounded"
            />
            <div className="flex items-center gap-2 bg-white px-2 rounded">
              <MdCalendarToday />
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="p-2 w-full"
              />
            </div>
            <input
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange}
              className="p-2 rounded"
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="p-2 rounded"
            >
              <option value="">Status</option>
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Partial</option>
              <option>Hold</option>
            </select>
            <button
              type="submit"
              className="bg-teal-600 text-white p-2 rounded hover:bg-teal-700"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeeDashboard;
