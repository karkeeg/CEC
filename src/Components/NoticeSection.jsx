import React, { useEffect, useState } from "react";
import { fetchNoticeTitles } from "../supabaseConfig/supabaseApi";
import { Link } from "react-router-dom";

import campusImage1 from "../assets/image1.png";
import campusImage2 from "../assets/thumbnail.png";
import campusImage3 from "../assets/image1.png";

const NoticeBar = () => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const getNotices = async () => {
      try {
        const data = await fetchNoticeTitles();
        setNotices(data || []);
      } catch (err) {
        setNotices([]);
      }
    };
    getNotices();
  }, []);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB"); // e.g. 11/07/2025
  };

  return (
    <>
      {/* Notice Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee {
          display: flex;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
      `}</style>
      <div className="w-full max-w-[1440px] h-[60px] md:px-[120px] px-4 flex items-center gap-2 md:gap-[10px] bg-black text-white overflow-hidden font-[Source Sans Pro]">
        <div className="flex items-center gap-2 bg-blue-700 h-full px-3 md:px-4 shrink-0">
          <span className="font-bold text-white text-[16px] md:text-[20px]">
            Notice
          </span>
          <span className="text-white text-lg">👉🏻</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full h-full flex items-center">
          {notices.length === 0 ? (
            <p className="marquee">No notices found</p>
          ) : (
            <div className="marquee">
              {/* Duplicate notices for seamless infinite scroll */}
              {[...notices, ...notices].map((n, i) => (
                <Link
                  key={i}
                  to={`/notices/${n.notice_id}`}
                  className="mx-8 inline-block text-white hover:underline hover:text-blue-300 transition"
                  style={{ minWidth: 200 }}
                >
                  📢 [{formatDate(n.created_at)}] <b>{n.title}</b> —{" "}
                  {n.description}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campus Carousel */}
      <section className="relative w-full">
        <div className="w-full h-[720px] overflow-hidden">
          <Carousel />
        </div>
      </section>
    </>
  );
};

function Carousel() {
  const images = [campusImage1, campusImage2, campusImage3];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`Campus ${index + 1}`}
          className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

export default NoticeBar;
