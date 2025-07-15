import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";

const Courses = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => {
        setDepartments(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-xl">Loading...</div>;
  }

  return (
    <section className="w-full bg-slate-100 pt-16 pb-8 px-4 sm:px-8 lg:px-16">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-16">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Academic Programs</h3>
          <h2 className="text-4xl font-bold">
            Explore <span className="text-blue-600">Departments</span>
          </h2>
        </div>

        {/* Vertically Scrollable Card Grid */}
        <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {departments.map((dept) => (
              <Link
                to={`/department/${dept.id}`}
                key={dept.id}
                className="bg-white border rounded-[24px] p-8 hover:shadow-xl cursor-pointer transition text-center flex items-center justify-center"
              >
                <span className="text-lg font-bold text-blue-700">
                  {dept.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
