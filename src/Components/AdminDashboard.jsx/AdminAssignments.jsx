import React, { useEffect, useState } from "react";
import {
  getAllAssignments,
  fetchAssignmentSubmissions,
  getStudentsByClass,
} from "../../supabaseConfig/supabaseApi";
// Removed PDF export per request
import { useUser } from "../../contexts/UserContext";
import Loader from "../Loader";

const AdminAssignmentsPage = () => {
  const { user, role } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
      const data = await getAllAssignments();
      // Frontend filtering based on role
      let filtered = data;
      if (role === "teacher") {
        filtered = data.filter(
          (a) => a.teacher_id === user.id || a.teacher_id === user.username
        );
      } else if (role === "student") {
        filtered = data.filter(
          (a) => a.year === user.year || a.class_id === user.class_id
        );
      }
    // Optional date filtering if provided
    if (fromDate) {
      filtered = filtered.filter((a) => new Date(a.due_date) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter((a) => new Date(a.due_date) <= new Date(toDate));
    }
    // Compute submission stats per assignment
    const withRates = await Promise.all(
      filtered.map(async (assignment) => {
        try {
          const submissions = await fetchAssignmentSubmissions(assignment.id);
          const totalSubmissions = Array.isArray(submissions) ? submissions.length : 0;
          let totalStudents = 0;
          if (assignment.class_id) {
            try {
              const classStudents = await getStudentsByClass(assignment.class_id);
              totalStudents = Array.isArray(classStudents) ? classStudents.length : 0;
            } catch (e) {
              totalStudents = 0;
            }
          }
          const submission_rate = totalStudents > 0
            ? Math.round((totalSubmissions / totalStudents) * 100)
            : 0;
          return {
            ...assignment,
            total_submissions: totalSubmissions,
            total_students: totalStudents,
            submission_rate,
          };
        } catch (e) {
          return {
            ...assignment,
            total_submissions: 0,
            total_students: 0,
            submission_rate: 0,
          };
        }
      })
    );
    setAssignments(withRates);
    setLoading(false);
  };

  // Removed exportToPDF

  // Group assignments by year
  const groupedByYear = assignments.reduce((acc, row) => {
    const year = row.year || "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(row);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading assignments data..." />
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📘 Assignment
        </h1>
        <div />
      </div>
      <h2 className="text-xl font-bold mb-4">Assignments Grouped by Year</h2>
      <div id="assignments-table" className="pdf-export">
        {Object.keys(groupedByYear).length === 0 ? (
          <div className="py-4 text-gray-500">No assignments found</div>
        ) : (
          Object.entries(groupedByYear).map(([year, yearAssignments]) => (
            <div key={year} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Year: {year}</h3>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-center border-collapse">
                  <thead className="bg-cyan-900 text-white">
                    <tr>
                      <th className="p-3 border">Assignment</th>
                      <th className="p-3 border">Teacher</th>
                      <th className="p-3 border">Submissions</th>
                      <th className="p-3 border">Submission Rate %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearAssignments.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`${
                          idx % 2 === 0 ? "bg-blue-100" : "bg-purple-200"
                        }`}
                      >
                        <td className="p-3 border">{row.title}</td>
                        <td className="p-3 border">
                          {row.teacher?.first_name} {row.teacher?.last_name}
                        </td>
                        <td className="p-3 border">{row.total_submissions}/{row.total_students}</td>
                        <td className="p-3 border">{typeof row.submission_rate === "number" ? `${row.submission_rate}%` : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAssignmentsPage;