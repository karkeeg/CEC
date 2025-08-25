import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDepartmentById } from "../supabaseConfig/supabaseApi";
import Loader from "../Components/Loader";

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDepartment = async () => {
      setLoading(true);
      try {
        const data = await fetchDepartmentById(id);
        setDepartment(data);
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader message="Loading department..." />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );

  if (!department) return null;

  return (
    <section className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Back to Home Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          
          {/* Full Width Department Image */}
          {department.image_url && (
            <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden">
              <img
                src={department.image_url}
                alt={department.name}
                loading="lazy"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Content Section */}
          <div className="p-8 md:p-12">
            {/* Department Name */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {department.name}
            </h1>
            
            {/* Department Description */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
                {department.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DepartmentDetail;