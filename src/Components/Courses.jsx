import React from "react";

const courses = [
  "MSC Engineering (Proposed)",
  "Bachelor In Civil Engineering",
  "Bachelor in Electrical Engineering",
  "Bachelor of Information Technology",
  "Diploma In Civil Engineering",
  "Diploma In Electrical Engineering",
  "Pre Diploma in Electrical Engineering",
  "Pre Diploma In Civil Engineering",
  "Pre Diploma In Computer Engineering",
  "General Medicine (HA)",
  "Diploma in Radiography",
  "PCL Health Lab Technician",
  "Masters In Business Administration",
  "Bachelor Of Business Administration",
  "Diploma in Pharmacy",
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
        <div className="h-[660px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <div
                key={index}
                className="bg-white border rounded-[24px] p-6 hover:shadow-xl transition text-center flex flex-col justify-center items-center"
              >
                <h3 className="text-lg font-bold text-blue-700 mb-2 bg-gradient-to-r from-[#1E449D] to-[rgba(77,167,204,0.5)] bg-clip-text text-transparent p-2 rounded-lg">
                  {course}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
