import React from "react";

const courseData = {
  code: "BIT",
  title: "Bachelors in Information Technology",
  description:
    "A comprehensive program focusing on IT skills. Gain expertise in software development, networking, and data systems.",
  duration: "4 Years",
};

const Courses = () => {
  const repeatCourses = Array(11).fill(courseData);

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
            {repeatCourses.map((course, index) => (
              <div
                key={index}
                className="bg-white border rounded-[24px] p-6 hover:shadow-xl transition"
              >
                <h3 className="text-5xl font-bold text-blue-700 mb-2 bg-gradient-to-r from-[#1E449D] to-[rgba(77,167,204,0.5)] bg-clip-text text-transparent p-2 rounded-lg">
                  {course.code}
                </h3>
                <p className="text-xl text-gray-700 mb-1">{course.title}</p>
                <p className="text-sm text-gray-700 mb-1">
                  {course.description}
                </p>
                <p className="text-xl pt-3 text-gray-500">{course.duration}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
