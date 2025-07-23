import React, { useEffect, useState } from "react";
import { getAllClasses } from "../../supabaseConfig/supabaseApi";
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

  // Only show classes the student is enrolled in
  const filteredClasses = classes.filter((cls) =>
    enrolledClassIds.includes(cls.class_id || cls.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-2 tracking-tight drop-shadow text-left">
            My Classes
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl text-left">
            View all your enrolled classes, their details, and your teachers.
            Click on a card to see more information about each class.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <button className="flex items-center gap-2 bg-[#007bff] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            <FaCalendarAlt /> 2025-01-01
          </button>
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search classes..."
              className="w-full py-2 pl-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            Export PDF
          </button>
        </div>

        {/* Card Layout */}
        {loading ? (
          <p className="p-4">Loading classes...</p>
        ) : error ? (
          <p className="p-4 text-red-600">Error: {error.message}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
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
                    className="bg-white/90 rounded-3xl shadow-2xl border border-blue-200 hover:shadow-2xl transition-all duration-300 p-10 flex flex-col justify-between min-h-[220px] relative group ring-1 ring-blue-100 hover:ring-2 hover:ring-blue-400 gap-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FaBookOpen className="text-blue-500 text-2xl" />
                      <span className="text-xl font-bold text-blue-900 group-hover:text-blue-700 transition whitespace-nowrap">
                        {capitalizeFirst(cls.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-700">
                      <FaUser className="text-blue-400" />
                      <span>{cls.subject?.name ?? "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-700">
                      <FaChalkboardTeacher className="text-green-400" />
                      <span>{fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
                      <FaDoorOpen className="text-indigo-400" />
                      <span>Room: {cls.room_no}</span>
                    </div>
                    <button
                      className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div>
                <strong>Name:</strong> {viewModal.name}
              </div>
              <div>
                <strong>Year:</strong> {viewModal.year}
              </div>
              <div>
                <strong>Semester:</strong> {viewModal.semester}
              </div>
              <div>
                <strong>Room:</strong> {viewModal.room_no}
              </div>
              <div>
                <strong>Capacity:</strong> {viewModal.capacity}
              </div>
              <div>
                <strong>Subject:</strong>{" "}
                {viewModal.subject?.name ?? viewModal.subject_id}
              </div>
              <div>
                <strong>Schedule:</strong> {viewModal.schedule}
              </div>
              <div>
                <strong>Description:</strong> {viewModal.description}
              </div>
              <div>
                <strong>Department:</strong> {viewModal.department_id}
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 mt-3 text-blue-800">
              Enrolled Students
            </h3>
            {modalLoading ? (
              <div>Loading students...</div>
            ) : modalStudents.length === 0 ? (
              <div className="text-gray-500">
                No students enrolled in this class.
              </div>
            ) : (
              <div className="w-full max-h-54 overflow-y-auto border rounded mb-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modalStudents.map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1">
                          {s.student.first_name} {s.student.middle_name || ""}{" "}
                          {s.student.last_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-semibold mt-4"
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
