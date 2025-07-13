import React, { useState, useEffect } from "react";
import personImage from "../assets/person.png";
import supabase from "../supabaseConfig/supabaseClient";

const IntroSection = () => {
  let [activeIndex, setActiveIndex] = useState(null);
  const [chairman, setChairman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stats = [
    { number: "25+", label: "Legacy" },
    { number: "1000+", label: "Graduates" },
    { number: "5+", label: "Accredited" },
    { number: "50+", label: "Faculty Members" },
    { number: "PU & CTEVTC", label: "Affiliated" },
  ];

  useEffect(() => {
    const fetchChairman = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", "chairmans-message")
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
      className="bg-secondary/100 font-sans flex flex-col mx-auto"
      style={{
        minHeight: "700px",
        paddingTop: "44px",
        paddingBottom: "32px",
        backgroundColor: "var(--secondary-100, #EEF0FD)",
      }}
    >
      <div className="w-full max-w-[1440px] px-4 md:px-8 lg:px-[120px] flex flex-col gap-[20px] mx-auto">
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
        <div className="flex flex-col justify-between gap-8">
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row ">
            {/* Left Text Section */}
            <div className="flex-1 text-[#1f1f1f] lg:mt-20">
              {loading ? (
                <div className="text-gray-500">
                  Loading chairman's message...
                </div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : chairman ? (
                <>
                  <h3 className="text-2xl font-bold mb-2">{chairman.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-gray-800">
                    {chairman.summary}
                  </p>
                  <div className="mt-4">
                    <a
                      href="/articles/chairmans-message"
                      className="inline-block px-5 py-2 bg-[#1b3e94] text-white rounded-full font-semibold shadow hover:bg-[#2a4bd7] transition"
                    >
                      Read More
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-gray-500">
                  No chairman's message found.
                </div>
              )}
            </div>

            {/* Right Image Section */}
            <div className="flex-1 w-full ">
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
                className={`flex-1 min-w-[120px] cursor-pointer rounded-md p-3 transition-all duration-300 hover:bg-[#2a4bd7]`}
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
