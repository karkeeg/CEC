import React, { useEffect, useState, useRef } from "react";
import { fetchNoticeTitles } from "../supabaseConfig/supabaseApi";
import { Link } from "react-router-dom";
import collegeVideo from "../assets/collegeHDVideo.mp4"

import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2 } from 'lucide-react';



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
        <div className="w-full h-[540px] overflow-hidden">
          <VideoSection />
        </div>
      </section>
    </>
  );
};
function VideoSection() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Handle play/pause when clicking anywhere on the video
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full h-full relative bg-black rounded-lg overflow-hidden shadow-2xl cursor-pointer" onClick={togglePlay}>
      {/* Video Element with reduced opacity */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover opacity-60"
        autoPlay
        loop
        playsInline
      >
        <source src={collegeVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
        {/* Welcome Text */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Welcome to
          </h1>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-blue-300 leading-tight">
              Central Engineering College
            </h2>
            <div className="flex items-center justify-center space-x-3">
              <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-16"></div>
              <span className="text-xl md:text-2xl text-gray-200 font-light tracking-wide">
                Nepal Technical Institute
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-16"></div>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="mt-8 text-lg md:text-xl text-gray-300 font-light max-w-2xl leading-relaxed">
          Building Tomorrow's Engineers Today
        </p>

        {/* Click hint */}
        <div className="mt-6 opacity-70">
          <p className="text-sm text-white/80 animate-pulse">
            Click anywhere to {isPlaying ? 'pause' : 'play'}
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-white/20"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-white/20"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-white/20"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-white/20"></div>
    </div>
  );
}

export default NoticeBar;
