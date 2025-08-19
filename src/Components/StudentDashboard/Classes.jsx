import React, { useEffect, useState } from "react";
import {
  getAllClasses,
  fetchDepartments,
} from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import {
  FaUser,
  FaBookOpen,
  FaCalendarAlt,
  FaDoorOpen,
  FaChalkboardTeacher,
  FaInfoCircle,
} from "react-icons/fa";
import Modal from "../Modal";

// Utility to capitalize the first letter
function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const Classes = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModal, setViewModal] = useState(null); // class to view
  const [modalStudents, setModalStudents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [enrolledClassIds, setEnrolledClassIds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});

  useEffect(() => {
    const fetchClasses = async () => {
      const data = await getAllClasses();
      setClasses(data);
      setLoading(false);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("student_classes")
        .select("class_id")
        .eq("student_id", user.id);
      if (!error && data) {
        setEnrolledClassIds(data.map((sc) => sc.class_id));
      }
    };
    fetchEnrolledClasses();
  }, [user]);

  useEffect(() => {
    // Fetch departments for department name lookup
    const fetchAllDepartments = async () => {
      try {
        const data = await fetchDepartments();
        setDepartments(data || []);
        // Build a map: id -> name
        const map = {};
        (data || []).forEach((d) => {
          map[d.id] = d.name;
        });
        setDepartmentMap(map);
      } catch {}
    };
    fetchAllDepartments();
  }, []);

  // Only show classes the student is enrolled in
  const filteredClasses = classes.filter((cls) =>
    enrolledClassIds.includes(cls.class_id || cls.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-900 mb-2 sm:mb-3 tracking-tight drop-shadow">
            My Classes
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-3xl">
            View all your enrolled classes, their details, and your teachers.
            Click on a card to see more information about each class.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative w-full sm:w-1/2 lg:w-2/5">
            <input
              type="text"
              placeholder="Search classes..."
              className="w-full py-2.5 sm:py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Card Layout */}
        {loading ? (
          <p className="p-4">Loading classes...</p>
        ) : error ? (
          <p className="p-4 text-red-600">Error: {error.message}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredClasses.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="text-5xl mb-4">📚</div>
                <div className="text-gray-500 text-lg font-semibold">
                  You are not enrolled in any classes yet.
                </div>
                <div className="text-gray-400 mt-2">
                  Please contact your administrator or teacher for enrollment.
                </div>
              </div>
            ) : (
              filteredClasses.map((cls, idx) => {
                const teacher = cls.teacher;
                const fullName = teacher
                  ? `${teacher.first_name ?? ""} ${teacher.middle_name ?? ""} ${
                      teacher.last_name ?? ""
                    }`.trim()
                  : "Unknown";
                return (
                  <div
                    key={idx}
                    className="bg-white/95 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] relative group border border-blue-200 hover:border-blue-400 gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <FaBookOpen className="text-blue-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-900 group-hover:text-blue-700 transition truncate">
                        {capitalizeFirst(cls.name)}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <FaUser className="text-blue-400 flex-shrink-0" />
                        <span className="truncate">{cls.subject?.name ?? "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <FaChalkboardTeacher className="text-green-400 flex-shrink-0" />
                        <span className="truncate">{fullName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <FaDoorOpen className="text-indigo-400 flex-shrink-0" />
                        <span>Room: {cls.room_no}</span>
                      </div>
                    </div>
                    <button
                      className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg shadow text-xs sm:text-sm lg:text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center gap-2"
                      onClick={async () => {
                        setViewModal(cls);
                        setModalLoading(true);
                        // Fetch students for this class
                        const { data, error } = await supabase
                          .from("student_classes")
                          .select(
                            "student:student_id(first_name, middle_name, last_name)"
                          )
                          .eq("class_id", cls.class_id || cls.id);
                        setModalStudents(data || []);
                        setModalLoading(false);
                      }}
                    >
                      <FaInfoCircle /> View Details
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View Details Modal */}
        {viewModal && (
          <Modal
            title={capitalizeFirst(viewModal.name)}
            onClose={() => setViewModal(null)}
          >
            <div className="mb-3">
              <div className="h-1 w-16 bg-blue-200 rounded mb-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 text-sm sm:text-base">
              <div className="space-y-2">
                <div><strong className="text-blue-800">Name:</strong> <span className="break-words">{viewModal.name}</span></div>
                <div><strong className="text-blue-800">Year:</strong> {viewModal.year}</div>
                <div><strong className="text-blue-800">Semester:</strong> {viewModal.semester}</div>
                <div><strong className="text-blue-800">Room:</strong> {viewModal.room_no}</div>
                <div><strong className="text-blue-800">Capacity:</strong> {viewModal.capacity}</div>
              </div>
              <div className="space-y-2">
                <div><strong className="text-blue-800">Subject:</strong> <span className="break-words">{viewModal.subject?.name ?? viewModal.subject_id}</span></div>
                <div><strong className="text-blue-800">Schedule:</strong> <span className="break-words">{viewModal.schedule}</span></div>
                <div><strong className="text-blue-800">Description:</strong> <span className="break-words">{viewModal.description}</span></div>
                <div><strong className="text-blue-800">Department:</strong> <span className="break-words">{departmentMap[viewModal.department_id] || viewModal.department_id}</span></div>
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 mt-4 text-blue-800">
              Enrolled Students
            </h3>
            {modalLoading ? (
              <div>Loading students...</div>
            ) : modalStudents.length === 0 ? (
              <div className="text-gray-500">
                No students enrolled in this class.
              </div>
            ) : (
              <div className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-24 sm:max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {modalStudents.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-sm whitespace-nowrap"
                    >
                      {s.student.first_name} {s.student.middle_name || ""}{" "}
                      {s.student.last_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow font-semibold mt-4 sm:mt-6 w-full sm:w-auto text-sm sm:text-base transition-colors"
              onClick={() => setViewModal(null)}
            >
              Close
            </button>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Classes;
