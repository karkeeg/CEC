import React from "react";
import { FaGraduationCap, FaHospitalSymbol } from "react-icons/fa";

const associations = [
  {
    name: "Central Engineering College",
    icon: <FaGraduationCap size={48} />,
    highlighted: true,
  },
  {
    name: "Nepal Technical Institute",
    icon: <FaGraduationCap size={48} />,
    highlighted: false,
  },
  {
    name: "Central Management College",
    icon: <FaGraduationCap size={48} />,
    highlighted: false,
  },
  {
    name: "Central Hospital",
    icon: <FaHospitalSymbol size={48} />,
    highlighted: false,
  },
];

const AssociationsSection = () => {
  return (
    <section className="bg-[#CEEAFB] w-full py-16 px-4 sm:px-8 md:px-10 lg:px-[120px]">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-10">
        {/* Heading */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Features</p>
          <h2 className="text-3xl font-bold">
            Our <span className="text-[#2a4bd7]">Associations</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {associations.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center justify-center text-center transition-all duration-300 rounded-[24px] border ${
                item.highlighted
                  ? "bg-[#143b82] text-white border-transparent"
                  : "bg-white text-black border-gray-300"
              } p-6 sm:p-8 w-full h-[240px] md:h-[260px] lg:h-[282px]`}
            >
              <div
                className={`mb-4 ${
                  item.highlighted ? "text-white" : "text-black"
                }`}
              >
                {item.icon}
              </div>
              <p className="text-lg font-semibold">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AssociationsSection;
