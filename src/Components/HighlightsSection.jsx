import React, { useState } from "react";
import { FaEye, FaBullseye, FaStar } from "react-icons/fa";

const highlights = [
  {
    title: "Vision",
    description:
      "To become one of Nepal’s most technically innovative engineering colleges and establish ourselves as a globally recognized institute of excellence.",
    icon: <FaEye size={48} className="text-blue-600" />,
  },
  {
    title: "Vision",
    description:
      "The college/institute takes care and nurtures pupils for extraordinary motivation and ability to prepare themselves as lifelong technical experts and leaders in the world.",
    icon: <FaBullseye size={48} className="text-red-500" />,
  },
  {
    title: "Vision",
    description:
      "Provide highly and qualified, experienced and focused faculty and dedicated mentor to include innovation and creativity in the diverse field of engineering medical science.",
    icon: <FaStar size={48} className="text-yellow-500" />,
  },
];

const HighlightsSection = () => {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <div
      className=" py-14 px-4"
      style={{ backgroundColor: "var(--secondary-100, #CEEAFB)" }}
    >
      <div className="text-center mb-16">
        <h4 className="text-xl font-semibold">Features</h4>
        <h2 className="text-4xl font-bold">
          Our <span className="text-teal-600">Highlights</span>
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row flex-wrap items-center justify-center gap-6 max-w-6xl mx-auto px-4">
        {highlights.map((item, index) => (
          <div
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`transition-all cursor-pointer p-6 rounded-xl shadow-md w-full sm:w-[90%] md:w-[400px] lg:w-[30%] text-center
        ${
          // bg will be blue when active and white when inactive
          activeIndex === index
            ? "bg-blue-900 text-white scale-105"
            : "bg-white text-black hover:scale-105"
        }`}
          >
            <div className="mb-4 flex items-center justify-center h-[180px] w-full">
              {item.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighlightsSection;
