import React, { useState } from "react";
import { MdCalendarToday, MdExpandMore } from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Attendance = () => {
  const [view, setView] = useState("monthly");

  const calendar = [
    ["", "", "", 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, "", ""],
  ];

  const statusMap = {
    3: "absent",
    9: "absent",
    13: "absent",
    18: "absent",
    22: "absent",
    30: "absent",
    4: "holiday",
    11: "holiday",
    18: "holiday",
    25: "holiday",
    27: "holiday",
    14: "holiday",
  };

  const getStatus = (day) => {
    if (!day) return "";
    return statusMap[day] || "present";
  };

  const renderDayCell = (day, index) => {
    const status = getStatus(day);
    let bgColor = "bg-[#5BAE9199]"; // Present
    if (status === "absent") bgColor = "bg-red-500";
    else if (status === "holiday") bgColor = "bg-[#CEEAFB]";

    if (!day) return <td key={index} className="p-4 border" />;
    return (
      <td
        key={index}
        className={`p-4 text-center border ${bgColor} text-black font-semibold`}
      >
        {day}
      </td>
    );
  };

  const weeklyRow = calendar[1];

  // Sample weekly stats for chart
  const attendanceStats = [
    { week: "Week 1", present: 5, absent: 2 },
    { week: "Week 2", present: 6, absent: 1 },
    { week: "Week 3", present: 5, absent: 2 },
    { week: "Week 4", present: 4, absent: 3 },
  ];

  return (
    <div className="ml-64 min-h-screen text-white p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Attendance
      </h1>

      {/* Date Picker and Tabs */}
      <div className="bg-[#6750A41A] mt-6 rounded-lg overflow-hidden">
        <div className="p-4 flex justify-center text-gray-600 items-center text-sm font-semibold">
          <span>2025-01-01</span>
          <MdCalendarToday className="ml-2" />
        </div>
        <div className="flex">
          <button
            onClick={() => setView("monthly")}
            className={`flex-1 text-center py-2 ${
              view === "monthly" ? "bg-cyan-600" : "bg-teal-600 opacity-70"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView("weekly")}
            className={`flex-1 text-center py-2 ${
              view === "weekly" ? "bg-cyan-600" : "bg-teal-600 opacity-70"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="overflow-x-auto mt-6">
        {view === "monthly" ? (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#327ea4] text-white text-sm">
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((day, i) => (
                  <th key={i} className="p-2 text-center border">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendar.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => renderDayCell(day, di))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#327ea4] text-white text-sm">
                <th className="p-2 border text-left">Day</th>
                <th className="p-2 border text-center">Date</th>
                <th className="p-2 border text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {weeklyRow.map((day, di) => {
                const dayName = [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][di];
                const status = getStatus(day);
                let bgColor = "bg-[#5BAE9199]";
                if (status === "absent") bgColor = "bg-red-500";
                else if (status === "holiday") bgColor = "bg-[#CEEAFB]";

                return (
                  <tr key={di}>
                    <td className="p-2 border text-gray-800 font-semibold">
                      {dayName}
                    </td>
                    <td
                      className={`p-2 border text-center ${bgColor} text-black font-semibold`}
                    >
                      {day || "-"}
                    </td>
                    <td className="p-2 border text-center capitalize text-gray-700">
                      {day ? status : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Legend */}
        <div className="flex text-right gap-6 text-sm mt-2">
          <div className="flex items-center text-center text-gray-500 gap-2">
            <div className="w-4 h-4 bg-[#5BAE9199]" /> Present
          </div>
          <div className="flex text-center text-gray-500 gap-2">
            <div className="w-4 h-4 bg-red-500" /> Absent
          </div>
          <div className="flex text-center text-gray-500 gap-2">
            <div className="w-4 h-4 bg-blue-200" /> Public Holiday
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-300">
            Your statistics
          </h2>
          <button className="bg-cyan-500 px-4 py-1 rounded-md flex items-center gap-2 text-sm">
            Present Days <MdExpandMore />
          </button>
        </div>

        {/* Real Attendance Chart */}
        <div className="bg-white rounded-lg p-4">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={attendanceStats}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="#22c55e"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="absent"
                stroke="#ef4444"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-8 text-xs mt-2">
          <div className="flex items-center gap-1 text-green-400">
            ⬤ Present
          </div>
          <div className="flex items-center gap-1 text-pink-300">⬤ Absent</div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
