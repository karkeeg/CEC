import React, { useEffect, useState } from "react";
import { fetchStudents } from "../supabaseConfig/supabaseApi";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getStudents = async () => {
      try {
        const data = await fetchStudents();
        setStudents(data);
        setError(null);
      } catch (err) {
        setError(err);
        setStudents([]);
      }
    };
    getStudents();
  }, []);

  return (
    <div className="overflow-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Student Records</h1>

      {error && <p className="text-red-500">Error: {error.message}</p>}

      <table className="min-w-[1200px] border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Reg No</th>
            <th className="border px-4 py-2">First Name</th>
            {/* <th className="border px-4 py-2">Middle Name</th>
            <th className="border px-4 py-2">Last Name</th> */}
            <th className="border px-4 py-2">DOB</th>
            <th className="border px-4 py-2">Gender</th>
            <th className="border px-4 py-2">Guardian</th>
            <th className="border px-4 py-2">Address</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Year</th>
            <th className="border px-4 py-2">Faculty</th>
            <th className="border px-4 py-2">Department</th>
            <th className="border px-4 py-2">Section</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.reg_no}>
              <td className="border px-4 py-2">{student.reg_no}</td>
              <td className="border px-4 py-2">{student.first_name}</td>
              {/* <td className="border px-4 py-2">{student.middle_name}</td>
              <td className="border px-4 py-2">{student.last_name}</td> */}
              <td className="border px-4 py-2">{student.date_of_birth}</td>
              <td className="border px-4 py-2">{student.gender}</td>
              <td className="border px-4 py-2">{student.guardian_name}</td>
              <td className="border px-4 py-2">{student.address}</td>
              <td className="border px-4 py-2">{student.email}</td>
              <td className="border px-4 py-2">{student.year}</td>
              <td className="border px-4 py-2">{student.faculty_id}</td>
              <td className="border px-4 py-2">{student.department_id}</td>
              <td className="border px-4 py-2">{student.section_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
