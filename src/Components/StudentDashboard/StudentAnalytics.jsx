import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  ReferenceLine,
  Label,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import {
  getFeedbackForStudent,
  getClassAverageBySubject,
  getAssignmentSubmissionRateBySubject,
} from "../../supabaseConfig/supabaseApi";

const pieColors = ["#1de9b6", "#ff1744", "#3399ff", "#ff9800", "#9c27b0", "#607d8b"];

const StudentAnalytics = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [loadingSubmissionRates, setLoadingSubmissionRates] = useState(false);
  const [loadingAverages, setLoadingAverages] = useState(false);
  const [classSubmissionData, setClassSubmissionData] = useState([]);
  const [classAverageData, setClassAverageData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getFeedbackForStudent(user.id);
        setFeedback(data);
      } catch (err) {
        setError("Failed to fetch feedback data. Please try again.");
        setFeedback([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [user]);

  // Calculate grade trend by month
  const gradeTrend = useMemo(() => {
    const monthMap = {};
    feedback.forEach((item) => {
      const grade = item.grade?.grade;
      if (typeof grade === "number") {
        const date = new Date(item.submitted_at || item.assignment?.due_date);
        const month = date.toLocaleString("default", { month: "short" });
        if (!monthMap[month]) monthMap[month] = [];
        monthMap[month].push(grade);
      }
    });
    return months.map((month) => ({
      month,
      avg: monthMap[month] && monthMap[month].length > 0
        ? Number((monthMap[month].reduce((a, b) => a + b, 0) / monthMap[month].length).toFixed(1))
        : 0,
    }));
  }, [feedback, months]);

  // Calculate subject-wise performance
  const subjectPerformance = useMemo(() => {
    const subjectMap = {};
    feedback.forEach((item) => {
      const grade = item.grade?.grade;
      if (typeof grade === "number") {
        const subject = item.assignment?.subject?.name || "Unknown";
        if (!subjectMap[subject]) subjectMap[subject] = [];
        subjectMap[subject].push(grade);
      }
    });
    return Object.entries(subjectMap).map(([name, arr]) => ({
      subject: name,
      avg: arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0,
    }));
  }, [feedback]);

  // Filter subjects based on search term
  const filteredSubjectPerformance = useMemo(() => {
    if (!searchTerm) return subjectPerformance;
    return subjectPerformance.filter(item => 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjectPerformance, searchTerm]);

  // Calculate attendance trend (proxy using feedback dates)
  const attendanceTrend = useMemo(() => {
    const attendanceMap = {};
    feedback.forEach((item) => {
      const date = new Date(item.submitted_at || item.assignment?.due_date);
      const month = date.toLocaleString("default", { month: "short" });
      if (!attendanceMap[month]) attendanceMap[month] = { present: 0, total: 0 };
      attendanceMap[month].present += 1;
      attendanceMap[month].total += 1;
    });
    return months.map((month) => ({
      month,
      attendance: attendanceMap[month] && attendanceMap[month].total > 0
        ? Math.round((attendanceMap[month].present / attendanceMap[month].total) * 100)
        : 0,
    }));
  }, [feedback, months]);

  // Calculate grade distribution
  const gradeDistribution = useMemo(() => {
    const gradeBuckets = [0, 60, 70, 80, 90, 100];
    const dist = Array(gradeBuckets.length - 1).fill(0);
    feedback.forEach((item) => {
      const grade = item.grade?.grade;
      if (typeof grade === "number") {
        for (let i = 0; i < gradeBuckets.length - 1; i++) {
          if (grade >= gradeBuckets[i] && (i === gradeBuckets.length - 2 ? grade <= gradeBuckets[i + 1] : grade < gradeBuckets[i + 1])) {
            dist[i]++;
            break;
          }
        }
      }
    });
    return dist.map((count, i) => ({
      name: i === gradeBuckets.length - 2 ? `${gradeBuckets[i]}-${gradeBuckets[i + 1]}%` : `${gradeBuckets[i]}-${gradeBuckets[i + 1] - 1}%`,
      value: count,
    }));
  }, [feedback]);

  // Get subject ID helper function
  const getSubjectId = useCallback((subjectName) => {
    for (const item of feedback) {
      if (item.assignment?.subject?.name === subjectName) {
        return item.assignment?.subject_id || item.assignment?.subject?.id || subjectName;
      }
    }
    return subjectName;
  }, [feedback]);

  // Fetch class submission rates
  useEffect(() => {
    const fetchSubmissionRates = async () => {
      if (subjectPerformance.length === 0) return;
      setLoadingSubmissionRates(true);
      try {
        const submissionPromises = subjectPerformance.map(async ({ subject, avg }) => {
          const subjectId = getSubjectId(subject);
          const classRate = await getAssignmentSubmissionRateBySubject(subjectId);
          return {
            subject,
            student: feedback.filter(item => item.assignment?.subject?.name === subject).length,
            classSubmitted: classRate.submitted,
            classTotal: classRate.total,
          };
        });
        const data = await Promise.all(submissionPromises);
        setClassSubmissionData(data);
      } catch (err) {
        console.error('Failed to fetch submission rates:', err);
      } finally {
        setLoadingSubmissionRates(false);
      }
    };
    fetchSubmissionRates();
  }, [subjectPerformance, getSubjectId, feedback]);

  // Fetch class averages
  useEffect(() => {
    const fetchClassAverages = async () => {
      if (subjectPerformance.length === 0) return;
      setLoadingAverages(true);
      try {
        const avgPromises = subjectPerformance.map(async ({ subject, avg }) => {
          const subjectId = getSubjectId(subject);
          const classAvg = await getClassAverageBySubject(subjectId);
          return {
            subject,
            student: avg,
            average: classAvg ? classAvg.toFixed(1) : 0,
          };
        });
        const data = await Promise.all(avgPromises);
        setClassAverageData(data);
      } catch (err) {
        console.error('Failed to fetch class averages:', err);
      } finally {
        setLoadingAverages(false);
      }
    };
    fetchClassAverages();
  }, [subjectPerformance, getSubjectId]);

  // Calculate assignment submission data for pie charts
  const assignmentSubmissionData = useMemo(() => {
    if (classSubmissionData.length === 0) return { student: [], class: [] };
    
    const totalStudent = classSubmissionData.reduce((a, b) => a + b.student, 0);
    const totalClassSubmitted = classSubmissionData.reduce((a, b) => a + b.classSubmitted, 0);
    const totalClass = classSubmissionData.reduce((a, b) => a + b.classTotal, 0);
    
    return {
      student: [
        { name: "You Submitted", value: totalStudent },
        { name: "You Missed", value: Math.max(0, totalClass - totalStudent) },
      ],
      class: [
        { name: "Class Submitted", value: totalClassSubmitted },
        { name: "Class Missed", value: Math.max(0, totalClass - totalClassSubmitted) },
      ]
    };
  }, [classSubmissionData]);

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 w-full min-w-0">
     
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6 mb-8">
  <div className="flex-1 min-w-0">
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight leading-tight">
      Student Analytics Dashboard
    </h1>
    <p className="text-sm text-gray-600 mt-2 font-medium">
      Track your academic progress and performance
    </p>
  </div>
  
  <button
    className="flex items-center justify-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 whitespace-nowrap"
    onClick={() => navigate("/student/feedback")}
  >
    <MdFeedback className="text-lg" />
    View Feedback
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
                    <XAxis dataKey="month" tick={false} axisLine={false} label={{ value: 'Months', position: 'insideBottom', offset: 0 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}>
                      <Label value="Average Grade (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip wrapperStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} />
                    <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />
                    <ReferenceLine x="Jun" stroke="#9CA3AF" strokeDasharray="3 3" />
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
                  data={filteredSubjectPerformance}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={false} axisLine={false} label={{ value: 'Subjects', position: 'insideBottom', offset: 0 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}>
                    <Label value="Average Grade (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                  </YAxis>
                  <Tooltip wrapperStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} />
                  <Legend />
                  <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />
                  <Bar dataKey="avg" fill="#1de9b6" radius={[6, 6, 0, 0]} />
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
                  <XAxis dataKey="month" tick={false} axisLine={false} label={{ value: 'Months', position: 'insideBottom', offset: 0 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}>
                    <Label value="Attendance (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                  </YAxis>
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip wrapperStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} />
                  <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />
                  <ReferenceLine x="Jun" stroke="#9CA3AF" strokeDasharray="3 3" />
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
                      data={assignmentSubmissionData.student}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {assignmentSubmissionData.student.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Pie
                      data={assignmentSubmissionData.class}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      label
                    >
                      {assignmentSubmissionData.class.map((entry, idx) => (
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
                      You Submitted: {assignmentSubmissionData.student[0]?.value ?? 0}
                    </li>
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[1] }}
                      />
                      You Missed: {assignmentSubmissionData.student[1]?.value ?? 0}
                    </li>
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[2] }}
                      />
                      Class Submitted: {assignmentSubmissionData.class[0]?.value ?? 0}
                    </li>
                    <li>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ background: pieColors[3] }}
                      />
                      Class Missed: {assignmentSubmissionData.class[1]?.value ?? 0}
                    </li>
                    <li className="mt-2 font-bold">
                      Your Submission Rate:{" "}
                      {assignmentSubmissionData.student[0] && assignmentSubmissionData.student[1]
                        ? Math.round(
                            (assignmentSubmissionData.student[0].value /
                              (assignmentSubmissionData.student[0].value +
                                assignmentSubmissionData.student[1].value)) *
                              100
                          )
                        : 0}
                      %
                    </li>
                    <li className="mt-2 font-bold">
                      Class Submission Rate:{" "}
                      {assignmentSubmissionData.class[0] && assignmentSubmissionData.class[1]
                        ? Math.round(
                            (assignmentSubmissionData.class[0].value /
                              (assignmentSubmissionData.class[0].value +
                                assignmentSubmissionData.class[1].value)) *
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
                    <XAxis dataKey="subject" tick={false} axisLine={false} label={{ value: 'Subjects', position: 'insideBottom', offset: 0 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}>
                      <Label value="Average Grade (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip wrapperStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} />
                    <Legend />
                    <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />
                    <Bar dataKey="student" fill="#1de9b6" name="You" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="average" fill="#3399ff" name="Class Avg" radius={[6, 6, 0, 0]} />
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
