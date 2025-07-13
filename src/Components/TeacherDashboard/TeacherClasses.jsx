import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  FaUsers,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBook,
  FaChartBar,
  FaGraduationCap,
} from "react-icons/fa";

const TeacherClasses = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.id) return;
      try {
        const { data: classes, error } = await supabase
          .from("classes")
          .select("*")
          // .eq("teacher_id", user.id);
        if (error) throw error;
        setClasses(classes || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]);

  const getClassStatus = (studentCount, capacity) => {
    const percentage = (studentCount / capacity) * 100;
    if (percentage >= 90)
      return { text: "Full", color: "bg-red-100 text-red-800" };
    if (percentage >= 75)
      return { text: "Almost Full", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Available", color: "bg-green-100 text-green-800" };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Classes</h1>
        <p className="text-gray-600">
          Manage your teaching schedule and class information
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Classes</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {classes.length}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <FaBook className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <FaUsers className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Average Class Size
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {classes.length > 0
                  ? Math.round(
                      classes.reduce((sum, cls) => sum + cls.studentCount, 0) /
                        classes.length
                    )
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <FaChartBar className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Departments</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {new Set(classes.map((cls) => cls.department)).size}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-full">
              <FaGraduationCap className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 text-lg">No classes found</div>
            <p className="text-gray-400 mt-2">
              You haven't been assigned to any classes yet.
            </p>
          </div>
        ) : (
          classes.map((cls, index) => {
            const status = getClassStatus(cls.studentCount, cls.capacity || 30);
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {cls.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                    >
                      {status.text}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {cls.description || "No description available"}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-2 text-gray-400" />
                      <span>
                        {cls.studentCount} / {cls.capacity || 30} students
                      </span>
                    </div>

                    {cls.schedule && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="mr-2 text-gray-400" />
                        <span>{cls.schedule}</span>
                      </div>
                    )}

                    {cls.room && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span>Room {cls.room}</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <FaGraduationCap className="mr-2 text-gray-400" />
                      <span>{cls.department}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (cls.studentCount / (cls.capacity || 30)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="ml-3 text-xs text-gray-500">
                        {Math.round(
                          (cls.studentCount / (cls.capacity || 30)) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeacherClasses;
