import React, { useState, useEffect } from "react";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useUser } from "../../contexts/UserContext";
import {
  getAttendanceByStudent,
  fetchSubjects,
  fetchTeachers,
  getAllClasses,
} from "../../supabaseConfig/supabaseApi";
import { Tooltip as ReactTooltip } from "react-tooltip";

const Attendance = () => {
  const [view, setView] = useState("monthly");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  console.log("Current User ID:", user?.id);
  const [subjects, setSubjects] = useState([]);
  const [subjectMap, setSubjectMap] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [teacherMap, setTeacherMap] = useState({});
  const [classesList, setClassesList] = useState([]);
  const [classMap, setClassMap] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [attendancePie, setAttendancePie] = useState([]);
  const [subjectBar, setSubjectBar] = useState([]);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date()); // For month navigation
  const pieColors = ["#22c55e", "#ef4444", "#facc15", "#3b82f6", "#a3a3a3"];

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth() + 1;
        // Calculate the first and last day of the month
        const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = `${year}-${String(month).padStart(2, "0")}-${String(
          new Date(year, month, 0).getDate()
        ).padStart(2, "0")}`;

        const records = await getAttendanceByStudent(
          user.id,
          firstDay,
          lastDay
        );
        console.log("Fetched Attendance Records:", records);
        setAttendance(records || []);
        console.log("Attendance State After Set:", records || []);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setAttendance([]);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [user, currentDisplayDate]); // Add currentDisplayDate to dependency array

  useEffect(() => {
    // Fetch subjects, teachers, and classes for name lookup
    const fetchLookups = async () => {
      try {
        const [subjectsData, teachersData, classesData] = await Promise.all([
          fetchSubjects(),
          fetchTeachers(),
          getAllClasses(),
        ]);
        setSubjects(subjectsData || []);
        setTeachers(teachersData || []);
        setClassesList(classesData || []);
        // Build maps
        const sMap = {};
        (subjectsData || []).forEach((s) => {
          sMap[s.id] = s.name;
        });
        setSubjectMap(sMap);
        const tMap = {};
        (teachersData || []).forEach((t) => {
          tMap[t.id] = [t.first_name, t.middle_name, t.last_name]
            .filter(Boolean)
            .join(" ");
        });
        setTeacherMap(tMap);
        const cMap = {};
        (classesData || []).forEach((c) => {
          cMap[c.id] = c.name;
        });
        setClassMap(cMap);
      } catch {}
    };
    fetchLookups();
  }, []);

  useEffect(() => {
    if (!attendance.length) return;
    console.log("Attendance data for chart calculations:", attendance);
    setLoadingStats(true);
    // Weekly stats
    const weekMap = {};
    attendance.forEach((rec) => {
      const date = new Date(rec.date);
      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `Week ${weekNum}`;
      if (!weekMap[weekKey])
        weekMap[weekKey] = {
          week: weekKey,
          present: 0,
          absent: 0,
          late: 0,
          holiday: 0,
        };
      if (rec.status === "present") weekMap[weekKey].present++;
      else if (rec.status === "absent") weekMap[weekKey].absent++;
      else if (rec.status === "late") weekMap[weekKey].late++;
      else if (rec.status === "holiday") weekMap[weekKey].holiday++;
    });
    setWeeklyStats(Object.values(weekMap));
    // Monthly stats
    const monthMap = {};
    attendance.forEach((rec) => {
      const date = new Date(rec.date);
      const month = date.toLocaleString("default", { month: "short" });
      if (!monthMap[month])
        monthMap[month] = { month, present: 0, absent: 0, late: 0, holiday: 0 };
      if (rec.status === "present") monthMap[month].present++;
      else if (rec.status === "absent") monthMap[month].absent++;
      else if (rec.status === "late") monthMap[month].late++;
      else if (rec.status === "holiday") monthMap[month].holiday++;
    });
    setMonthlyStats(Object.values(monthMap));
    // Pie chart
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const holiday = attendance.filter((a) => a.status === "holiday").length;
    setAttendancePie([
      { name: "Present", value: present },
      { name: "Absent", value: absent },
      { name: "Late", value: late },
      { name: "Holiday", value: holiday },
    ]);
    // Bar chart by subject
    const subjMap = {};
    attendance.forEach((rec) => {
      const subj = subjectMap[rec.subject_id] || rec.subject_id || "Unknown";
      if (!subjMap[subj])
        subjMap[subj] = {
          subject: subj,
          present: 0,
          absent: 0,
          late: 0,
          holiday: 0,
        };
      if (rec.status === "present") subjMap[subj].present++;
      else if (rec.status === "absent") subjMap[subj].absent++;
      else if (rec.status === "late") subjMap[subj].late++;
      else if (rec.status === "holiday") subjMap[subj].holiday++;
    });
    setSubjectBar(Object.values(subjMap));
    setLoadingStats(false);
  }, [attendance, subjectMap]);

  // Helper: build a map of date string (YYYY-MM-DD) => attendance record
  const attendanceMap = React.useMemo(() => {
    const map = {};
    const statusPriority = {
      holiday: 4,
      absent: 3,
      late: 2,
      present: 1,
    };

    attendance.forEach((rec) => {
      if (!map[rec.date] || statusPriority[rec.status] > statusPriority[map[rec.date].status]) {
        map[rec.date] = rec;
      }
    });
    return map;
  }, [attendance]);

  const goToPreviousMonth = () => {
    setCurrentDisplayDate(
      (prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDisplayDate(
      (prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1)
    );
  };

  const goToCurrentMonth = () => {
    setCurrentDisplayDate(new Date());
  };

  // Get current year and month for the calendar
  const currentYear = currentDisplayDate.getFullYear();
  const currentMonth = currentDisplayDate.getMonth(); // 0-based
  // Get number of days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Build calendar weeks for the current month
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const calendar = [];
  let week = new Array(firstDayOfWeek).fill("");
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push("");
    calendar.push(week);
  }

  // Helper: render a day cell with real attendance data
  const renderDayCell = (day, index) => {
    if (!day) return <td key={index} className="p-4 border bg-gray-50" />;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    const rec = attendanceMap[dateStr];
    let bgColor = "bg-gray-100";
    let status = "No Data";
    if (rec) {
      status = rec.status;
      if (rec.status === "present") bgColor = "bg-green-500";
      else if (rec.status === "absent") bgColor = "bg-red-500";
      else if (rec.status === "holiday") bgColor = "bg-blue-500";
      else if (rec.status === "late") bgColor = "bg-yellow-200";
      else bgColor = "bg-gray-200";
    }
    return (
      <td
        key={index}
        className={`p-4 text-center border ${bgColor} text-black font-semibold relative`}
        data-tip={
          rec
            ? `Status: ${rec.status}\nSubject: ${
                subjectMap[rec.subject_id] || rec.subject_id
              }\nClass: ${classMap[rec.class_id] || rec.class_id}\nTeacher: ${
                teacherMap[rec.teacher_id] || rec.teacher_id
              }\nNote: ${rec.note || "-"}`
            : "No attendance data"
        }
        data-for="attendance-tip"
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
    <div className="min-h-screen text-white p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 w-full min-w-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Attendance
      </h1>

      {/* Date Picker and Tabs */}
      <div className="bg-[#6750A41A] mt-6 rounded-lg overflow-hidden min-w-0">
        <div className="p-4 flex justify-between text-gray-600 items-center text-sm font-semibold">
          <button onClick={goToPreviousMonth} className="px-2 py-1 rounded hover:bg-gray-200">
            &lt;
          </button>
          <span>
            {currentDisplayDate.toLocaleString("default", { month: "long" })}{" "}
            {currentDisplayDate.getFullYear()}
          </span>
          <button onClick={goToNextMonth} className="px-2 py-1 rounded hover:bg-gray-200">
            &gt;
          </button>
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
      <div className="overflow-x-auto mt-6 min-w-0">
        {view === "monthly" ? (
          <>
            <table className="min-w-full border-collapse text-sm md:text-base">
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
            <ReactTooltip id="attendance-tip" multiline={true} effect="solid" />
            {/* Legend */}
            <div className="flex flex-row gap-2 text-gray-900 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-green-500 border rounded" />
                <span className="font-semibold">Green = Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-red-500 border rounded" />
                <span className="font-semibold ">Red= Absent </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-blue-500 border rounded" />
                <span className="font-semibold">Blue= Holiday </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-yellow-500 border rounded" />
                <span className="font-semibold">Yellow= Late </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-gray-200 border rounded" />
                <span className="font-semibold">Gray= No Data </span>
                <span className="text-gray-500">
                  (No attendance record for this day)
                </span>
              </div>
            </div>
          </>
        ) : (
          <table className="min-w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="bg-[#327ea4] text-white text-sm">
                <th className="p-2 text-center border">Date</th>
                <th className="p-2 text-center border">Status</th>
                <th className="p-2 text-center border">Subject</th>
                <th className="p-2 text-center border">Class</th>
                <th className="p-2 text-center border">Teacher</th>
                <th className="p-2 text-center border">Note</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-gray-500 text-center">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendance.map((rec) => (
                  <tr key={rec.id}>
                    <td className="p-2 border text-center text-gray-800 font-semibold">
                      {rec.date}
                    </td>
                    <td className="p-2 border text-center capitalize text-gray-700">
                      {rec.status}
                    </td>
                    <td className="p-2 border text-center text-gray-700">
                      {subjectMap[rec.subject_id] || rec.subject_id}
                    </td>
                    <td className="p-2 border text-center text-gray-700">
                      {classMap[rec.class_id] || rec.class_id}
                    </td>
                    <td className="p-2 border text-center text-gray-700">
                      {teacherMap[rec.teacher_id] || rec.teacher_id}
                    </td>
                    <td className="p-2 border text-center text-gray-700">
                      {rec.note}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Statistics Section */}
        <div className="mt-10 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2 min-w-0">
            <h2 className="text-lg font-semibold text-gray-300">
              Your statistics
            </h2>
            <button className="bg-cyan-500 px-4 py-1 rounded-md flex items-center gap-2 text-sm">
              Present Days <MdExpandMore />
            </button>
          </div>

          {/* Attendance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Weekly Attendance Line Chart */}
            <div className="bg-white rounded-lg p-3 sm:p-4 min-w-0 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Weekly Attendance
              </h3>
              {loadingStats ? (
                <div className="text-gray-500 text-base">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={weeklyStats}
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
                    <Line
                      type="monotone"
                      dataKey="late"
                      stroke="#facc15"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="holiday"
                      stroke="#3b82f6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Attendance Breakdown Pie Chart */}
            <div className="bg-white rounded-lg p-3 sm:p-4 min-w-0 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Attendance Breakdown
              </h3>
              {loadingStats ? (
                <div className="text-gray-500 text-base">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={attendancePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {attendancePie.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Monthly Attendance Bar Chart */}
            <div className="bg-white rounded-lg p-3 sm:p-4 min-w-0 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Monthly Attendance
              </h3>
              {loadingStats ? (
                <div className="text-gray-500 text-base">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={monthlyStats}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#22c55e" name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    <Bar dataKey="late" fill="#facc15" name="Late" />
                    <Bar dataKey="holiday" fill="#3b82f6" name="Holiday" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Attendance by Subject Bar Chart */}
            <div className="bg-white rounded-lg p-3 sm:p-4 min-w-0 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Attendance by Subject
              </h3>
              {loadingStats ? (
                <div className="text-gray-500 text-base">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={subjectBar}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#22c55e" name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    <Bar dataKey="late" fill="#facc15" name="Late" />
                    <Bar dataKey="holiday" fill="#3b82f6" name="Holiday" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
