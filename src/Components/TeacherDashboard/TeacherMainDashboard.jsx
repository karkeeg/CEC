import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import supabase from "../../supabaseConfig/supabaseClient";
import {
  FaUsers,
  FaBook,
  FaClipboardList,
  FaCalendarCheck,
  FaChartLine,
  FaBell,
} from "react-icons/fa";

const TeacherMainDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        // Fetch total students and assignments from the whole database
        const [
          { data: studentsData },
          { data: assignmentsData },
          { data: classesData },
        ] = await Promise.all([
          supabase.from("students").select("reg_no"),
          supabase.from("assignments").select("id"),
          supabase
            .from("classes")
            .select("id, teacher_id")
            
        ]);
        setStats({
          totalStudents: studentsData?.length || 0,
          totalClasses: classesData?.length || 0,
          totalAssignments: assignmentsData?.length || 0,
          attendanceRate: 85, 
        });
        // Fetch recent assignments for this teacher
        const { data: teacherAssignments } = await supabase
          .from("assignments")
          .select("*")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentActivities(teacherAssignments || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FaUsers className="text-white text-xl" />}
          title="Total Students"
          value={stats.totalStudents}
          color="bg-blue-500"
        />
        <StatCard
          icon={<FaBook className="text-white text-xl" />}
          title="Active Classes"
          value={stats.totalClasses}
          color="bg-green-500"
        />
        <StatCard
          icon={<FaClipboardList className="text-white text-xl" />}
          title="Assignments"
          value={stats.totalAssignments}
          color="bg-purple-500"
        />
        <StatCard
          icon={<FaCalendarCheck className="text-white text-xl" />}
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Activities
            </h2>
            <FaBell className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      New assignment: {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No recent activities
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Quick Actions
            </h2>
            <FaChartLine className="text-gray-400" />
          </div>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
              Create New Assignment
            </button>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors">
              Take Attendance
            </button>
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors">
              Grade Assignments
            </button>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherMainDashboard;
