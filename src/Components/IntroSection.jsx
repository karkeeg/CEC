import React, { useState } from "react";
import personImage from "../assets/person.png";

const IntroSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const stats = [
    { number: "25+", label: "Legacy" },
    { number: "1000+", label: "Graduates" },
    { number: "5+", label: "Accredited" },
    { number: "50+", label: "Faculty Members" },
    { number: "PU & CTEVTC", label: "Affiliated" },
  ];

  return (
    <section
      className="bg-secondary/100 font-sans flex flex-col mx-auto"
      style={{
        minHeight: "900px",
        paddingTop: "64px",
        paddingBottom: "32px",
        backgroundColor: "var(--secondary-100, #EEF0FD)",
      }}
    >
      <div className="w-full max-w-[1440px] px-4 md:px-10 lg:px-[120px] flex flex-col gap-[64px] mx-auto">
        {/* Heading */}
        <div className="text-center">
          <p className="text-xl font-bold text-[#1f1f1f]">
            Innovate with CEC/NTI, Janakpur
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Your <span className="text-[#2a4bd7]">Future</span> Starts Here
          </h2>
        </div>

        {/* Main Content and Stats */}
        <div className="flex flex-col justify-between gap-10">
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left Text Section */}
            <div className="flex-1 text-[#1f1f1f]">
              <h3 className="text-2xl font-bold mb-2">
                First commitment of our college is <br />
                <span className="italic font-extrabold text-2xl text-black">
                  "QUALITY EDUCATION IS OUR COMMITMENT"
                </span>
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-800">
                Established in 2053 B.S. with the guiding principle “Quality
                Education is Our Commitment,” our institution began its journey
                as Nepal Technical Institute Pvt. Ltd., offering a range of
                technical courses in engineering and health sciences. Today, as
                Central Engineering College, we proudly continue this legacy by
                offering a Bachelor in Civil Engineering (4 years) affiliated
                with Purbanchal University, along with Diploma programs in Civil
                Engineering and Electrical Engineering (3 years each), and
                short-term programs in Electrical Sub-Overseer and Survey
                Engineering (15 months) affiliated with CTEVT. As the Chairman,
                I extend my best wishes to all aspiring students and invite you
                to be a part of our mission to empower the next generation of
                skilled professionals.
              </p>
            </div>

            {/* Right Image Section */}
            <div className="flex-1 w-full">
              <img
                src={personImage}
                alt="Chairman or Student"
                className="rounded-md object-cover w-full max-w-[486px] h-auto mx-auto"
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-[#1f4b5e] text-white rounded-md py-6 px-4 flex flex-wrap justify-between items-center text-center gap-4">
            {stats.map((item, index) => (
              <div
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`flex-1 min-w-[120px] cursor-pointer rounded-md p-3 transition-all duration-300 ${
                  activeIndex === index ? "bg-[#2a4bd7]" : "bg-transparent"
                }`}
              >
                <p className="text-xl font-bold">{item.number}</p>
                <p className="text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
