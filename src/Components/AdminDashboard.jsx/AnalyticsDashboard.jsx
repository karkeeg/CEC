import React, { useEffect, useState } from "react";
import {
  getAllStudents,
  getAllTeachers,
  getAllClasses,
  getAllAssignments,
  getAllAttendance,
  getAllFees,
  getAllDepartments,
  getAllSubjects,
  fetchAssignmentSubmissions,
  fetchRecentSubmissions,
  fetchRecentAssignments,
  fetchRecentNotices,
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import Loader from "../Loader";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#E74C3C",
];

// REMOVE FeeModel class and all frontend status calculation

const AnalyticsDashboard = () => {
  // Stat cards
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    assignments: 0,
    avgGrade: 0,
    attendanceRate: 0,
    totalFees: 0,
    overdueFees: 0,
  });
  // Chart data
  const [gradeTrend, setGradeTrend] = useState([]);
  const [assignmentCompletion, setAssignmentCompletion] = useState([]);
  const [attendancePie, setAttendancePie] = useState([]);
  const [feeBar, setFeeBar] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [departmentPie, setDepartmentPie] = useState([]);
  const [subjectBar, setSubjectBar] = useState([]);
  const [genderPie, setGenderPie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Store raw data for alerts and analytics
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all base data in parallel
        const [
          studentsData,
          teachers,
          classes,
          assignmentsData,
          attendanceData,
          feesData,
          departments,
          subjects,
        ] = await Promise.all([
          getAllStudents(),
          getAllTeachers(),
          getAllClasses(),
          getAllAssignments(),
          getAllAttendance(),
          getAllFees(),
          getAllDepartments(),
          getAllSubjects(),
        ]);
        setStudents(studentsData);
        setAttendance(attendanceData);
        setFees(feesData);
        // Fetch submissions for each assignment for alerts/grades
        const assignmentsWithSubs = await Promise.all(
          assignmentsData.map(async (a) => {
            const submissions = await fetchAssignmentSubmissions(a.id);
            return { ...a, submissions };
          })
        );
        setAssignments(assignmentsWithSubs);

        // DEBUG: Let's also directly query the grades table to see what's there
        console.log("DEBUG: Direct grades query test");
        const { data: directGrades, error: gradesError } = await supabase
          .from("grades")
          .select("*")
          .limit(10);
        console.log("DEBUG: Direct grades query result:", {
          directGrades,
          gradesError,
        });

        // Alternative approach: Get all grades and map them to submissions
        const { data: gradesFromDB, error: allGradesError } = await supabase
          .from("grades")
          .select("*");
        console.log("DEBUG: All grades:", gradesFromDB);

        // Create a map of submission_id to grade
        const gradeMap = {};
        if (gradesFromDB) {
          gradesFromDB.forEach((grade) => {
            gradeMap[grade.submission_id] = grade;
          });
        }
        console.log("DEBUG: Grade map:", gradeMap);

        // Now let's manually attach grades to submissions
        const assignmentsWithGrades = assignmentsWithSubs.map((assignment) => ({
          ...assignment,
          submissions: assignment.submissions.map((submission) => ({
            ...submission,
            grade: gradeMap[submission.id] || null,
          })),
        }));

        console.log(
          "DEBUG: Assignments with manually attached grades:",
          assignmentsWithGrades
        );
        setAssignments(assignmentsWithGrades);
        // Stat cards
        const present = attendanceData.filter(
          (a) => a.status === "present"
        ).length;
        const totalAttendance = attendanceData.length || 1;
        const attendanceRate = Math.round((present / totalAttendance) * 100);
        const totalFees = feesData.reduce(
          (sum, f) => sum + Number(f.paid_amount || 0),
          0
        );
        const overdueFees = feesData
          .filter((f) => f.status === "overdue")
          .reduce(
            (sum, f) => sum + (Number(f.amount) - (f.paid_amount || 0)),
            0
          );
        // Average grade
        let allGrades = [];
        for (const assignment of assignmentsWithSubs) {
          for (const sub of assignment.submissions) {
            // Handle both nested grade object and direct grade number
            let gradeValue = null;
            if (
              sub.grade &&
              typeof sub.grade === "object" &&
              typeof sub.grade.grade === "number"
            ) {
              gradeValue = sub.grade.grade;
            } else if (sub.grade && typeof sub.grade === "number") {
              gradeValue = sub.grade;
            }
            if (gradeValue !== null) {
              allGrades.push(gradeValue);
            }
          }
        }
        const avgGrade =
          allGrades.length > 0
            ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(
                1
              )
            : 0;
        setStats({
          students: studentsData.length,
          teachers: teachers.length,
          classes: classes.length,
          assignments: assignmentsData.length,
          avgGrade,
          attendanceRate,
          totalFees,
          overdueFees,
        });
        // Grade trend (area chart, by month)
        const monthMap = {};
        for (const assignment of assignmentsWithSubs) {
          for (const sub of assignment.submissions) {
            // Handle both nested grade object and direct grade number
            let gradeValue = null;
            if (
              sub.grade &&
              typeof sub.grade === "object" &&
              typeof sub.grade.grade === "number"
            ) {
              gradeValue = sub.grade.grade;
            } else if (sub.grade && typeof sub.grade === "number") {
              gradeValue = sub.grade;
            }
            if (gradeValue !== null) {
              const date = new Date(assignment.due_date);
              const month = date.toLocaleString("default", { month: "short" });
              if (!monthMap[month]) monthMap[month] = [];
              monthMap[month].push(gradeValue);
            }
          }
        }
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
        // Assignment completion by class (bar)
        const classMap = {};
        for (const cls of classes) {
          classMap[cls.class_id || cls.id] =
            cls.name || `Class ${cls.class_id || cls.id}`;
        }
        const completionMap = {};
        for (const assignment of assignmentsWithSubs) {
          const classId = assignment.class_id;
          if (!completionMap[classId])
            completionMap[classId] = {
              class: classMap[classId] || classId,
              total: 0,
              submitted: 0,
            };
          completionMap[classId].total++;
          completionMap[classId].submitted += assignment.submissions.length;
        }
        setAssignmentCompletion(
          Object.values(completionMap).map((c) => ({
            class: c.class,
            completion:
              c.total > 0 ? Math.round((c.submitted / c.total) * 100) : 0,
          }))
        );
        // Attendance breakdown (pie)
        const presentCount = attendanceData.filter(
          (a) => a.status === "present"
        ).length;
        const absentCount = attendanceData.filter(
          (a) => a.status === "absent"
        ).length;
        const lateCount = attendanceData.filter(
          (a) => a.status === "late"
        ).length;
        setAttendancePie([
          { name: "Present", value: presentCount },
          { name: "Absent", value: absentCount },
          { name: "Late", value: lateCount },
        ]);
        // Fee collection vs. due by year (composed)
        const yearMap = {};
        for (const fee of feesData) {
          const year = fee.year || "Unknown";
          if (!yearMap[year]) yearMap[year] = { year, due: 0, collected: 0 };
          yearMap[year].due += Number(fee.amount || 0);
          yearMap[year].collected += Number(fee.paid_amount || 0);
        }
        setFeeBar(Object.values(yearMap));
        // Top 5 students by performance (bar)
        const studentGradeMap = {};
        for (const assignment of assignmentsWithSubs) {
          for (const sub of assignment.submissions) {
            // Handle both nested grade object and direct grade number
            let gradeValue = null;
            if (
              sub.grade &&
              typeof sub.grade === "object" &&
              typeof sub.grade.grade === "number"
            ) {
              gradeValue = sub.grade.grade;
            } else if (sub.grade && typeof sub.grade === "number") {
              gradeValue = sub.grade;
            }
            if (sub.student_id && gradeValue !== null) {
              if (!studentGradeMap[sub.student_id])
                studentGradeMap[sub.student_id] = [];
              studentGradeMap[sub.student_id].push(gradeValue);
            }
          }
        }
        const top = Object.entries(studentGradeMap)
          .map(([id, grades]) => {
            const student = studentsData.find((s) => s.id === id);
            return {
              name: student ? `${student.first_name} ${student.last_name}` : id,
              avg:
                grades.length > 0
                  ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(
                      1
                    )
                  : 0,
            };
          })
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5);
        setTopStudents(top);
        // Department/subject/gender distribution
        const deptMap = {};
        for (const s of studentsData) {
          const dept = s.department || "Unknown";
          if (!deptMap[dept]) deptMap[dept] = 0;
          deptMap[dept]++;
        }
        setDepartmentPie(
          Object.entries(deptMap).map(([name, value], i) => ({ name, value }))
        );
        const subjMap = {};
        for (const a of assignmentsWithSubs) {
          const subj = a.subject?.name || a.subject || "Unknown";
          if (!subjMap[subj]) subjMap[subj] = 0;
          subjMap[subj]++;
        }
        setSubjectBar(
          Object.entries(subjMap).map(([name, value]) => ({ name, value }))
        );
        const genderMap = { Male: 0, Female: 0 };
        for (const s of studentsData) {
          if (s.gender?.toLowerCase() === "male") genderMap.Male++;
          else if (s.gender?.toLowerCase() === "female") genderMap.Female++;
        }
        setGenderPie([
          { name: "Male", value: genderMap.Male },
          { name: "Female", value: genderMap.Female },
        ]);
      } catch (err) {
        setError("Failed to fetch analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // After fetching all data and before return, compute alert lists
  const [lowAttendance, setLowAttendance] = useState([]);
  const [lowGrades, setLowGrades] = useState([]);
  const [overdueFees, setOverdueFees] = useState([]);

  useEffect(() => {
    if (loading || error) return;
    // Low Attendance (<75%)
    const attendanceMap = {};
    attendance.forEach((a) => {
      if (!attendanceMap[a.student_id])
        attendanceMap[a.student_id] = { present: 0, total: 0 };
      if (a.status === "present") attendanceMap[a.student_id].present++;
      attendanceMap[a.student_id].total++;
    });
    const lowAtt = students
      .map((s) => {
        const att = attendanceMap[s.id] || { present: 0, total: 0 };
        const rate = att.total > 0 ? (att.present / att.total) * 100 : 100;
        return { ...s, attendanceRate: Math.round(rate) };
      })
      .filter((s) => s.attendanceRate < 75);
    setLowAttendance(lowAtt);
    // Low Grades (<60%)
    const studentGradeMap = {};
    console.log("DEBUG: All assignments with submissions:", assignments);

    for (const assignment of assignments) {
      const submissions = assignment.submissions || [];
      console.log(
        `DEBUG: Assignment ${assignment.id} has ${submissions.length} submissions:`,
        submissions
      );

      for (const sub of submissions) {
        console.log(`DEBUG: Submission ${sub.id} grade data:`, {
          student_id: sub.student_id,
          grade: sub.grade,
          gradeType: typeof sub.grade,
          hasGrade: !!sub.grade,
          gradeKeys: sub.grade ? Object.keys(sub.grade) : null,
        });

        // Handle both nested grade object and direct grade number
        let gradeValue = null;
        if (
          sub.grade &&
          typeof sub.grade === "object" &&
          sub.grade.grade !== undefined &&
          typeof sub.grade.grade === "number"
        ) {
          gradeValue = sub.grade.grade;
          console.log(`DEBUG: Found nested grade: ${gradeValue}`);
        } else if (sub.grade && typeof sub.grade === "number") {
          gradeValue = sub.grade;
          console.log(`DEBUG: Found direct grade: ${gradeValue}`);
        } else if (
          sub.grade &&
          typeof sub.grade === "object" &&
          sub.grade.length > 0
        ) {
          // Handle case where grade might be an array
          const firstGrade = sub.grade[0];
          if (firstGrade && typeof firstGrade.grade === "number") {
            gradeValue = firstGrade.grade;
            console.log(`DEBUG: Found array grade: ${gradeValue}`);
          }
        } else {
          console.log(`DEBUG: No valid grade found for submission ${sub.id}`);
        }

        if (sub.student_id && gradeValue !== null) {
          if (!studentGradeMap[sub.student_id])
            studentGradeMap[sub.student_id] = [];
          studentGradeMap[sub.student_id].push(gradeValue);
          console.log(
            `DEBUG: Added grade ${gradeValue} for student ${sub.student_id}`
          );
        }
      }
    }

    console.log("DEBUG: Final studentGradeMap:", studentGradeMap);
    const lowGr = students
      .map((s) => {
        const grades = studentGradeMap[s.id] || [];
        const avg =
          grades.length > 0
            ? grades.reduce((a, b) => a + b, 0) / grades.length
            : 100;
        return { ...s, avgGrade: Math.round(avg) };
      })
      .filter((s) => s.avgGrade < 60);
    setLowGrades(lowGr);
    console.log("Low grades calculation:", {
      totalStudents: students.length,
      studentsWithGrades: Object.keys(studentGradeMap).length,
      lowGradesCount: lowGr.length,
      lowGrades: lowGr.map((s) => ({
        name: `${s.first_name} ${s.last_name}`,
        avgGrade: s.avgGrade,
      })),
    });
    // Overdue Fees (use only DB status)
    const overdue = fees
      .filter((f) => f.status === "overdue")
      .map((f) => {
        const student = students.find((s) => s.id === f.student_id);
        return {
          ...f,
          studentName: student
            ? `${student.first_name} ${student.last_name}`
            : f.student_id,
          year: student ? student.year : "-",
        };
      });
    setOverdueFees(overdue);
  }, [students, attendance, assignments, fees, loading, error]);

  return (
    <div className="min-h-screen border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-700 p-6 w-full">
      <h1 className="font-bold text-3xl p-2 mb-8 text-center">
        Admin Analytics Dashboard
      </h1>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader message="Loading analytics dashboard data..." />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <StatCard
              label="Students"
              value={stats.students}
              color="bg-blue-500"
            />
            <StatCard
              label="Teachers"
              value={stats.teachers}
              color="bg-green-500"
            />
            <StatCard
              label="Classes"
              value={stats.classes}
              color="bg-purple-500"
            />
            <StatCard
              label="Assignments"
              value={stats.assignments}
              color="bg-yellow-500"
            />
            <StatCard
              label="Avg Grade"
              value={stats.avgGrade + "%"}
              color="bg-pink-500"
            />
            <StatCard
              label="Attendance Rate"
              value={stats.attendanceRate + "%"}
              color="bg-cyan-500"
            />
            <StatCard
              label="Total Fees"
              value={"Rs." + stats.totalFees}
              color="bg-indigo-500"
            />
            <StatCard
              label="Overdue Fees"
              value={"Rs." + stats.overdueFees}
              color="bg-red-500"
            />
          </div>
          {/* Alerts Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <h3 className="font-bold text-red-700 mb-2">
                  Low Attendance (&lt;75%) - Top 7
                </h3>
                {lowAttendance.length === 0 ? (
                  <div className="text-gray-400">
                    No students with low attendance.
                  </div>
                ) : (
                  <ul className="text-sm text-red-800 space-y-1">
                    {lowAttendance.slice(0, 7).map((s, i) => (
                      <li key={i}>
                        {s.first_name} {s.last_name} (Year: {s.year}) (
                        {s.attendanceRate}%)
                      </li>
                    ))}
                    {lowAttendance.length > 7 && (
                      <li className="text-gray-500 italic">
                        ... and {lowAttendance.length - 7} more students
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                <h3 className="font-bold text-yellow-700 mb-2">
                  Average Low Grades (&lt;60%) - Top 7
                </h3>
                {lowGrades.length === 0 ? (
                  <div className="text-gray-400">
                    No students with low grades.
                  </div>
                ) : (
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {lowGrades.slice(0, 7).map((s, i) => (
                      <li key={i}>
                        {s.first_name} {s.last_name} (Year: {s.year}) (
                        {s.avgGrade}%)
                      </li>
                    ))}
                    {lowGrades.length > 7 && (
                      <li className="text-gray-500 italic">
                        ... and {lowGrades.length - 7} more students
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                <h3 className="font-bold text-orange-700 mb-2">
                  Overdue Fees - Top 7
                </h3>
                {overdueFees.length === 0 ? (
                  <div className="text-gray-400">No overdue fees.</div>
                ) : (
                  <ul className="text-sm text-orange-800 space-y-1">
                    {overdueFees.slice(0, 7).map((f, i) => (
                      <li key={i}>
                        {f.studentName} (Year: {f.year}) - Rs.
                        {Number(f.amount) - (f.paid_amount || 0)}
                      </li>
                    ))}
                    {overdueFees.length > 7 && (
                      <li className="text-gray-500 italic">
                        ... and {overdueFees.length - 7} more overdue fees
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Area Chart: Grade Trend */}
            <ChartCard title="Average Grade Trend (Monthly)">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={gradeTrend}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
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
            </ChartCard>
            {/* Bar Chart: Assignment Completion by Class */}
            <ChartCard title="Assignment Completion Rate by Class">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={assignmentCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="completion"
                    fill="#10B981"
                    name="Completion %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            {/* Pie Chart: Attendance Breakdown */}
            <ChartCard title="Attendance Breakdown">
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
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            {/* Composed Chart: Fee Collection vs Due by Year */}
            <ChartCard title="Fee Collection vs. Due by Year">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={feeBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="due" fill="#f59e42" name="Total Due" />
                  <Bar
                    dataKey="collected"
                    fill="#10b981"
                    name="Total Collected"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
            {/* Bar Chart: Top 5 Students by Performance */}
            <ChartCard title="Top 5 Students by Performance">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topStudents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#6366F1" name="Avg Grade" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            {/* Pie Chart: Department Distribution */}
            <ChartCard title="Department Distribution">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={departmentPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {departmentPie.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            {/* Bar Chart: Subject Distribution */}
            <ChartCard title="Subject Distribution">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#00C49F" name="Assignments" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            {/* Pie Chart: Gender Distribution */}
            <ChartCard title="Gender Distribution">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={genderPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {genderPie.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

// Stat Card Component
function StatCard({ label, value, color }) {
  return (
    <div
      className={`rounded-lg shadow-md p-6 flex flex-col items-center ${color} text-white`}
    >
      <span className="text-lg font-semibold mb-2">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  );
}
// Chart Card Wrapper
function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <div className="w-full">{children}</div>
    </div>
  );
}

export default AnalyticsDashboard;
