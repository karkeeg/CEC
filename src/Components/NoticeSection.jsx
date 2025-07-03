import React from "react";
import campusImage from "../assets/image 19.png";

const notices = [
  "Assessment Exam Notice -(2082/3/10) for BCE -I/II and III/I",
  "Assessment Exam Notice -(2082/3/10) for BIT -I/II and III/I",
  "Final Exam Form Fill-up Notice -(2082/3/15) for BCA -II/II",
];

export default function NoticeBar() {
  return (
    <>
      <div className="w-full max-w-[1440px] h-[60px] md:px-[120px] px-4 flex items-center gap-2 md:gap-[10px] bg-black text-white overflow-hidden font-[Source Sans Pro]">
        <div className="flex items-center gap-2 bg-blue-700 h-full px-3 md:px-4 shrink-0">
          <span className="font-bold text-white text-[16px] md:text-[20px] leading-[120%]">
            Notice
          </span>
          <span className="text-white text-lg">👉🏻</span>
        </div>

        {/* Marquee */}
        <div className="overflow-hidden whitespace-nowrap w-full h-full flex items-center">
          <div className="animate-marquee flex gap-8 md:gap-12">
            {[...notices, ...notices].map((notice, index) => (
              <span
                key={index}
                className="text-[16px] md:text-[20px] font-bold leading-[120%] tracking-[0%] font-[Source Sans Pro]"
              >
                {notice}
              </span>
            ))}
          </div>
        </div>
      </div>
      <section className="relative w-full">
        <img
          src={campusImage}
          alt="CEC Campus"
          className="w-full h-[720px] object-cover"
        />
      </section>
    </>
  );
}
