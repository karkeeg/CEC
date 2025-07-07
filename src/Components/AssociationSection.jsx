import React, { useState } from "react";
import { FaGraduationCap, FaHospitalSymbol } from "react-icons/fa";

const associations = [
  {
    name: "Central Engineering College",
    icon: <FaGraduationCap size={48} />,
  },
  {
    name: "Nepal Technical Institute",
    icon: <FaGraduationCap size={48} />,
  },
  {
    name: "Central Management College",
    icon: <FaGraduationCap size={48} />,
  },
  {
    name: "Central Hospital",
    icon: <FaHospitalSymbol size={48} />,
  },
];

const AssociationsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0); // First card active by default

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
          {associations.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`flex flex-col items-center justify-center text-center transition-all duration-300 ease-in-out rounded-[24px] border cursor-pointer transform
                  ${
                    isActive
                      ? "bg-blue-900 text-white border-transparent"
                      : "bg-white text-black border-gray-300"
                  }
                  hover:scale-105 hover:shadow-xl hover:border-blue-600
                  p-6 sm:p-8 w-full h-[240px] md:h-[260px] lg:h-[282px]`}
              >
                <div
                  className={`mb-4 ${
                    isActive ? "text-white" : "text-blue-800"
                  }`}
                >
                  {item.icon}
                </div>
                <p className="text-lg font-semibold">{item.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AssociationsSection;
