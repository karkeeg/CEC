import React, { useEffect, useState } from "react";
import { FaSearch, FaRegChartBar } from "react-icons/fa";
import { MdFeedback } from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useUser } from "../../contexts/UserContext";
import {
  getFeedbackForStudent,
  getClassAverageBySubject,
  getAssignmentSubmissionRateBySubject,
} from "../../supabaseConfig/supabaseApi";

const pieColors = ["#1de9b6", "#ff1744"];

const StudentAnalytics = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [gradeTrend, setGradeTrend] = useState([]);
  const [subjectBar, setSubjectBar] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [assignmentSubmission, setAssignmentSubmission] = useState([]);
  const [classSubmissionRate, setClassSubmissionRate] = useState([]);
  const [loadingSubmissionRates, setLoadingSubmissionRates] = useState(false);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [mostImproved, setMostImproved] = useState(null);
  const [classAverageData, setClassAverageData] = useState([]);
  const [loadingAverages, setLoadingAverages] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const fetchAnalytics = async () => {
      try {
        // Fetch feedback (grades) for the student
        const feedback = await getFeedbackForStudent(user.id);
        // Grade trend by month
        const monthMap = {};
        const subjectMap = {};
        let allGrades = [];
        feedback.forEach((item) => {
          const grade = item.grade?.grade;
          if (typeof grade === "number") {
            const date = new Date(
              item.submitted_at || item.assignment?.due_date
            );
            const month = date.toLocaleString("default", { month: "short" });
            if (!monthMap[month]) monthMap[month] = [];
            monthMap[month].push(grade);
            // Subject-wise
            const subject = item.assignment?.subject?.name || "Unknown";
            if (!subjectMap[subject]) subjectMap[subject] = [];
            subjectMap[subject].push(grade);
            allGrades.push({ subject, grade });
          }
        });
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        setGradeTrend(
          months.map((month) => ({
            month,
            avg:
              monthMap[month] && monthMap[month].length > 0
                ? Number(
                    (
                      monthMap[month].reduce((a, b) => a + b, 0) /
                      monthMap[month].length
                    ).toFixed(1)
                  )
                : 0,
          }))
        );
        // Subject-wise bar
        setSubjectBar(
          Object.entries(subjectMap).map(([name, arr]) => ({
            subject: name,
            avg:
              arr.length > 0
                ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
                : 0,
          }))
        );
        // Attendance trend (by month)
        // For simplicity, use feedback dates as attendance proxies (replace with real attendance if available)
        const attendanceMap = {};
        feedback.forEach((item) => {
          const date = new Date(item.submitted_at || item.assignment?.due_date);
          const month = date.toLocaleString("default", { month: "short" });
          if (!attendanceMap[month])
            attendanceMap[month] = { present: 0, total: 0 };
          attendanceMap[month].present += 1; // Assume present for each feedback
          attendanceMap[month].total += 1;
        });
        setAttendanceTrend(
          months.map((month) => ({
            month,
            attendance:
              attendanceMap[month] && attendanceMap[month].total > 0
                ? Math.round(
                    (attendanceMap[month].present /
                      attendanceMap[month].total) *
                      100
                  )
                : 0,
          }))
        );
        // Assignment submission rate (student and class)
        setLoadingSubmissionRates(true);
        const subjectEntries = Object.entries(subjectMap);
        const submissionPromises = subjectEntries.map(
          async ([subject, arr]) => {
            // Try to get subject id from feedback data
            let subjectId = null;
            for (const item of feedback) {
              if (item.assignment?.subject?.name === subject) {
                subjectId =
                  item.assignment?.subject_id ||
                  item.assignment?.subject?.id ||
                  subject;
                break;
              }
            }
            if (!subjectId) subjectId = subject;
            const classRate = await getAssignmentSubmissionRateBySubject(
              subjectId
            );
            return {
              subject,
              student: arr.length, // student's own submissions for this subject
              classSubmitted: classRate.submitted,
              classTotal: classRate.total,
            };
          }
        );
        const submissionData = await Promise.all(submissionPromises);
        // For the pie chart, sum all subjects
        const totalStudent = submissionData.reduce((a, b) => a + b.student, 0);
        const totalClassSubmitted = submissionData.reduce(
          (a, b) => a + b.classSubmitted,
          0
        );
        const totalClass = submissionData.reduce((a, b) => a + b.classTotal, 0);
        setAssignmentSubmission([
          { name: "You Submitted", value: totalStudent },
          { name: "You Missed", value: Math.max(0, totalClass - totalStudent) },
        ]);
        setClassSubmissionRate([
          { name: "Class Submitted", value: totalClassSubmitted },
          {
            name: "Class Missed",
            value: Math.max(0, totalClass - totalClassSubmitted),
          },
        ]);
        setLoadingSubmissionRates(false);
        // Grade distribution (donut)
        const gradeBuckets = [0, 60, 70, 80, 90, 100];
        const dist = Array(gradeBuckets.length - 1).fill(0);
        allGrades.forEach(({ grade }) => {
          for (let i = 0; i < gradeBuckets.length - 1; i++) {
            if (grade >= gradeBuckets[i] && grade < gradeBuckets[i + 1]) {
              dist[i]++;
              break;
            }
          }
        });
        setGradeDistribution(
          dist.map((count, i) => ({
            name: `${gradeBuckets[i]}-${gradeBuckets[i + 1] - 1}%`,
            value: count,
          }))
        );
        // Most improved subject (largest positive difference between first and last grade)
        let improved = null;
        for (const [subject, arr] of subjectEntries) {
          if (arr.length > 1) {
            const diff = arr[arr.length - 1] - arr[0];
            if (!improved || diff > improved.diff) {
              improved = { subject, diff };
            }
          }
        }
        setMostImproved(improved);
        // Class average comparison (real)
        setLoadingAverages(true);
        const avgPromises = subjectEntries.map(async ([subject, arr]) => {
          // Try to get subject id from feedback data
          let subjectId = null;
          for (const item of feedback) {
            if (item.assignment?.subject?.name === subject) {
              subjectId =
                item.assignment?.subject_id ||
                item.assignment?.subject?.id ||
                subject;
              break;
            }
          }
          if (!subjectId) subjectId = subject;
          const avg = await getClassAverageBySubject(subjectId);
          return {
            subject,
            student:
              arr.length > 0
                ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
                : 0,
            average: avg ? avg.toFixed(1) : 0,
          };
        });
        const classAvgData = await Promise.all(avgPromises);
        setClassAverageData(classAvgData);
        setLoadingAverages(false);
      } catch (err) {
        setError("Failed to fetch analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 w-full min-w-0">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 tracking-tight drop-shadow-sm">
        Student Analytics Dashboard
      </h1>
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 min-w-0">
        <div className="flex items-center bg-[#30B0C733] rounded px-4 py-2 w-full sm:w-80 min-w-0">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-black flex-1 placeholder-black"
          />
          <FaSearch className="text-black ml-2" />
        </div>
        <button className="flex items-center gap-2 bg-teal-500 text-white px-6 py-2 rounded font-semibold hover:bg-teal-600 transition">
          View feedback <MdFeedback />
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-lg">Loading analytics...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <>
          {/* Grade Trend */}
          <div className="mb-12 min-w-0">
            <h3 className="text-lg font-bold text-gray-700 mb-4">
              Your Grade Trend
            </h3>
            <div className="bg-blue-50 rounded-md p-3 sm:p-6 flex flex-col items-center text-gray-800 min-w-0 overflow-x-auto">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={gradeTrend}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorGrade"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366F1"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366F1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="avg"
                      stroke="#6366F1"
                      fillOpacity={1}
                      fill="url(#colorGrade)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Subject-wise Performance */}
          <div className="bg-blue-100 rounded-md p-3 sm:p-6 mt-8 min-w-0 overflow-x-auto">
            <div className="flex items-center mb-4">
              <FaRegChartBar className="text-2xl mr-2" />
              <h3 className="text-xl font-bold text-gray-800">
                Subject-wise Performance
              </h3>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectBar}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" stroke="#000" />
                  <YAxis stroke="#000" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#1de9b6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Attendance Trend */}
          <div className="bg-[#f5f7fa] rounded-md p-3 sm:p-6 mt-8 min-w-0 overflow-x-auto">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">📈</span>
              <h3 className="text-xl font-bold text-gray-800">
                Attendance Trend
              </h3>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={attendanceTrend}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorAttendance"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1de9b6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1de9b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#000" />
                  <YAxis stroke="#000" />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#1de9b6"
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Assignment Submission Rate (You vs Class) */}
          <div className="bg-[#f5f7fa] rounded-md p-3 sm:p-6 mt-8 min-w-0 overflow-x-auto">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">📊</span>
              <h3 className="text-xl font-bold text-gray-800">
                Assignment Submission Rate
              </h3>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assignmentSubmission}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {assignmentSubmission.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Pie
                      data={classSubmissionRate}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      label
                    >
                      {classSubmissionRate.map((entry, idx) => (
                        <Cell
                          key={`cell-class-${idx}`}
                          fill={pieColors[(idx + 2) % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
                <h4 className="text-lg font-semibold mb-2">Summary</h4>
                {loadingSubmissionRates ? (
                  <div className="text-gray-500 text-base">
                    Loading submission rates...
                  </div>
                ) : (
                  <ul className="text-gray-700">
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[0] }}
                      />
                      You Submitted: {assignmentSubmission[0]?.value ?? 0}
                    </li>
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[1] }}
                      />
                      You Missed: {assignmentSubmission[1]?.value ?? 0}
                    </li>
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[2] }}
                      />
                      Class Submitted: {classSubmissionRate[0]?.value ?? 0}
                    </li>
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[3] }}
                      />
                      Class Missed: {classSubmissionRate[1]?.value ?? 0}
                    </li>
                    <li className="mt-2 font-bold">
                      Your Submission Rate:{" "}
                      {assignmentSubmission[0] && assignmentSubmission[1]
                        ? Math.round(
                            (assignmentSubmission[0].value /
                              (assignmentSubmission[0].value +
                                assignmentSubmission[1].value)) *
                              100
                          )
                        : 0}
                      %
                    </li>
                    <li className="mt-2 font-bold">
                      Class Submission Rate:{" "}
                      {classSubmissionRate[0] && classSubmissionRate[1]
                        ? Math.round(
                            (classSubmissionRate[0].value /
                              (classSubmissionRate[0].value +
                                classSubmissionRate[1].value)) *
                              100
                          )
                        : 0}
                      %
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          {/* Grade Distribution Donut Chart */}
          <div className="bg-white rounded-md p-3 sm:p-6 mt-8 min-w-0 overflow-x-auto">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🍩</span>
              <h3 className="text-xl font-bold text-gray-800">
                Grade Distribution
              </h3>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    label
                  >
                    {gradeDistribution.map((entry, idx) => (
                      <Cell
                        key={`cell-grade-${idx}`}
                        fill={pieColors[idx % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Most Improved Subject */}
          {mostImproved && (
            <div className="bg-green-50 rounded-md p-3 sm:p-6 mt-8 min-w-0 overflow-x-auto">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🚀</span>
                <h3 className="text-xl font-bold text-gray-800">
                  Most Improved Subject
                </h3>
              </div>
              <div className="text-lg text-green-800 font-semibold">
                {mostImproved.subject} (+{mostImproved.diff} points)
              </div>
            </div>
          )}
          {/* Comparison to Class Average */}
          <div className="bg-blue-50 rounded-md p-3 sm:p-6 mt-8 min-w-0 overflow-x-auto">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">📚</span>
              <h3 className="text-xl font-bold text-gray-800">
                Comparison to Class Average
              </h3>
            </div>
            <div className="w-full h-72">
              {loadingAverages ? (
                <div className="text-gray-500 text-base flex items-center justify-center h-full">
                  Loading class averages...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classAverageData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" stroke="#000" />
                    <YAxis stroke="#000" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="student" fill="#1de9b6" name="You" />
                    <Bar dataKey="average" fill="#3399ff" name="Class Avg" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAnalytics;
