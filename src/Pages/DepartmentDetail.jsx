import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchDepartmentById } from "../supabaseConfig/supabaseApi";
import Loader from "../Components/Loader";

const DepartmentDetail = () => {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDepartment = async () => {
      setLoading(true);
      try {
        const data = await fetchDepartmentById(id);
        // Parse courses JSON if present
        let courses = data.courses;
        try {
          courses =
            courses && typeof courses === "string"
              ? JSON.parse(courses)
              : courses;
        } catch (e) {}
        setDepartment({ ...data, courses });
        setError(null);
      } catch (err) {
        setError("Department not found.");
        setDepartment(null);
      }
      setLoading(false);
    };
    getDepartment();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading department..." />
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!department) return null;

  return (
    <section className="bg-[#F7F9FB] min-h-screen py-12 px-4 md:px-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1b3e94] mb-8 text-center">
          {department.name}
        </h1>
        <img
          src={department.image_url}
          alt={department.name}
          className="w-full h-60 object-cover rounded mb-6"
        />
        <p className="text-gray-700 mb-4 text-lg">{department.description}</p>
        {department.courses && Array.isArray(department.courses) && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-[#3cb4d4]">
              Courses
            </h2>
            <ul className="list-disc pl-6">
              {department.courses.map((course, idx) => (
                <li key={idx} className="mb-1 text-gray-800">
                  {course}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default DepartmentDetail;
