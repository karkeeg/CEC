import React, { useState, useEffect } from "react";
import personImage from "../assets/chairman.jpg";
import supabase from "../supabaseConfig/supabaseClient";
import {
  FaAward,
  FaUserGraduate,
  FaUniversity,
  FaUsers,
  FaMedal,
} from "react-icons/fa";

const stats = [
  {
    number: "25+",
    label: "Legacy",
    icon: <FaAward className="text-2xl text-blue-100" />,
  },
  {
    number: "1000+",
    label: "Graduates",
    icon: <FaUserGraduate className="text-2xl text-blue-100" />,
  },
  {
    number: "5+",
    label: "Accredited",
    icon: <FaMedal className="text-2xl text-blue-100" />,
  },
  {
    number: "50+",
    label: "Faculty Members",
    icon: <FaUsers className="text-2xl text-blue-100" />,
  },
  {
    number: "PU & CTEVTC",
    label: "Affiliated",
    icon: <FaUniversity className="text-2xl text-blue-100" />,
  },
];

const IntroSection = () => {
  const [chairman, setChairman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null); // For hover tracking

  useEffect(() => {
    const fetchChairman = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", "Chairman Message")
        .maybeSingle();
      if (error) {
        setError(error.message);
        setChairman(null);
      } else {
        setChairman(data);
      }
      setLoading(false);
    };
    fetchChairman();
  }, []);

  return (
    <section
      className="relative font-sans flex flex-col mx-auto w-full"
      style={{ minHeight: "700px" }}
    >
      {/* Gradient BG */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 -z-10" />
      <div className="w-full max-w-[1440px] px-4 md:px-8 lg:px-[120px] flex flex-col gap-16 mx-auto py-16">
        {/* Heading */}
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-[#1f1f1f] tracking-wide mb-2">
            Innovate with CEC/NTI, Janakpur
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-2 text-blue-900">
            Your <span className="text-blue-600">Future</span> Starts Here
          </h2>
        </div>

        {/* Main Content and Stats */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Text Section */}
          <div className="flex-1 flex flex-col justify-center items-start text-[#1f1f1f] max-w-xl">
            {loading ? (
              <div className="text-gray-500">Loading chairman's message...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : chairman ? (
              <>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-blue-900">
                  {chairman.title}
                </h3>
                <p className="mt-2 text-lg leading-relaxed text-gray-800 mb-6">
                  {chairman.full_content.slice(0, 450)}...
                </p>
                <a
                  href="/articles/Chairman Message"
                  className="inline-block px-6 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-full font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
                >
                  Read More
                </a>
              </>
            ) : (
              <div className="text-gray-500">No chairman's message found.</div>
            )}
          </div>

          {/* Right Image Section */}
          <div className="flex-1 flex items-center">
            <div className="relative w-full">
              <img
                src={personImage}
                alt="Chairman or Student"
                className="rounded-2xl object-cover w-full h-auto shadow-xl border-4 border-white"
                style={{ minHeight: 320 }}
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow text-blue-900 font-bold text-lg border border-blue-100">
                Chairman
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar with Hover Effect */}
        <div className="bg-[#1f4b5e] text-white rounded-md py-6 px-4 flex flex-wrap justify-between items-center text-center gap-4">
          {stats.map((item, index) => (
            <div
              key={index}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex-1 min-w-[120px] cursor-pointer rounded-md p-3 transition-all duration-300
                ${
                  activeIndex === index
                    ? "bg-[#2a4bd7] scale-105 shadow-lg"
                    : "bg-transparent"
                }
                hover:bg-[#2a4bd7] hover:scale-105`}
            >
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-xl font-bold">{item.number}</p>
              <p className="text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
