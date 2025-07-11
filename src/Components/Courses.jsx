import React from "react";
import {
  FaTools,
  FaHardHat,
  FaBolt,
  FaLaptopCode,
  FaUserMd,
  FaXRay,
  FaVial,
  FaBusinessTime,
  FaUserGraduate,
  FaMicroscope,
  FaUserNurse,
  FaBriefcase,
  FaCapsules,
} from "react-icons/fa";

const courses = [
  { name: "MSC Engineering (Proposed)", icon: <FaTools /> },
  { name: "Bachelor In Civil Engineering", icon: <FaHardHat /> },
  { name: "Bachelor in Electrical Engineering", icon: <FaBolt /> },
  { name: "Bachelor of Information Technology", icon: <FaLaptopCode /> },
  { name: "Diploma In Civil Engineering", icon: <FaHardHat /> },
  { name: "Diploma In Electrical Engineering", icon: <FaBolt /> },
  { name: "Pre Diploma in Electrical Engineering", icon: <FaBolt /> },
  { name: "Pre Diploma In Civil Engineering", icon: <FaHardHat /> },
  { name: "Pre Diploma In Computer Engineering", icon: <FaLaptopCode /> },
  { name: "General Medicine (HA)", icon: <FaUserMd /> },
  { name: "Diploma in Radiography", icon: <FaXRay /> },
  { name: "PCL Health Lab Technician", icon: <FaMicroscope /> },
  { name: "Masters In Business Administration", icon: <FaBusinessTime /> },
  { name: "Bachelor Of Business Administration", icon: <FaBriefcase /> },
  { name: "Diploma in Pharmacy", icon: <FaCapsules /> },
];

const Courses = () => {
  return (
    <section className="w-full bg-slate-100 pt-16 pb-8 px-4 sm:px-8 lg:px-16">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-16">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Academic Programs</h3>
          <h2 className="text-4xl font-bold">
            Explore <span className="text-blue-600">Courses</span>
          </h2>
        </div>

        {/* Card  */}
        <div className="h-[380px] overflow-y-auto pr-2 scrollbar-none">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            style={{
              gridAutoRows: "1fr",
              maxHeight: "calc(2 * 180px)",
              overflowY: "auto",
            }}
          >
            {courses.map((course, index) => (
              <div
                key={index}
                className="bg-white border rounded-[24px] p-8 hover:shadow-xl cursor-pointer transition text-center flex flex-col justify-center items-center"
              >
                <div className="flex flex-row items-center  justify-center mb-2">
                  <span className="text-2xl text-blue-700 m-0 p-0 leading-none">
                    {course.icon}
                  </span>
                  <h3 className="text-lg font-bold text-blue-700 m-0 p-0 leading-none">
                    {course.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
