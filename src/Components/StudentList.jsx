import React, { useEffect, useState } from "react";
import supabase from "../supabaseConfig/supabaseClient";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from("students").select("*");
      // .order("reg_no");

      if (error) {
        console.error("Error:", error.message);
        setError(error);
      } else {
        setStudents(data);
      }
    };

    fetchStudents();
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
          {students.map((s) => (
            <tr key={s.reg_no} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{s.reg_no}</td>
              <td className="border px-4 py-2">
                {s.first_name} {s.middle_name} {s.last_name}
              </td>
              {/* <td className="border px-4 py-2">{s.middle_name} </td>
              <td className="border px-4 py-2">{s.last_name}</td> */}
              <td className="border px-4 py-2">{s.date_of_birth}</td>
              <td className="border px-4 py-2">{s.gender}</td>
              <td className="border px-4 py-2">{s.guardian_name}</td>
              <td className="border px-4 py-2">{s.address}</td>
              <td className="border px-4 py-2">{s.email}</td>
              <td className="border px-4 py-2">{s.year}</td>
              <td className="border px-4 py-2">{s.faculty_id}</td>
              <td className="border px-4 py-2">{s.department_id}</td>
              <td className="border px-4 py-2">{s.section_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
