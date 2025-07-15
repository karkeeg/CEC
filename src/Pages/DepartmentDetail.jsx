import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";

const DepartmentDetail = () => {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("departments")
        .select(
          "id, name, description, courses, image_url, faculty:faculty_id(id, name)"
        )
        .eq("id", id)
        .single();
      if (error) {
        setError("Department not found.");
        setDepartment(null);
      } else {
        // Parse courses JSON if present
        let courses = data.courses;
        try {
          courses =
            courses && typeof courses === "string"
              ? JSON.parse(courses)
              : courses;
        } catch (e) {
          // fallback: leave as string
        }
        setDepartment({ ...data, courses });
        setError(null);
      }
      setLoading(false);
    };
    fetchDepartment();
  }, [id]);

  if (loading)
    return <div className="p-10 text-center text-xl">Loading...</div>;
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!department) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      {department.image_url && (
        <img
          src={department.image_url}
          alt={department.name}
          className="w-full h-64 object-cover rounded mb-6"
        />
      )}
      <h1 className="text-3xl font-bold mb-2">{department.name}</h1>
      <h2 className="text-lg text-gray-600 mb-4">{department.faculty?.name}</h2>
      <p className="mb-6 text-gray-800">{department.description}</p>
      {department.courses && typeof department.courses === "object" && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Course Structure</h3>
          <div className="space-y-2">
            {Object.entries(department.courses).map(([year, subjects], idx) => (
              <div key={idx}>
                <div className="font-bold text-blue-700 mb-1">{year}</div>
                <ul className="list-disc ml-6">
                  {subjects.map((subject, sidx) => (
                    <li key={sidx}>{subject}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetail;
