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
      <div className="w-full max-w-[1440px] h-[40px] md:px-[120px] px-4 flex items-center gap-2 md:gap-[10px] bg-black text-white overflow-hidden font-[Source Sans Pro]">
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
        {/* Full width container with fixed height */}
        <div className="w-full h-[100vh] sm:h-[100vh] lg:h-[100vh] xl:h-[100vh] min-h-[600px] max-h-[950px] overflow-hidden">
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
    <div className="w-full h-full relative bg-black  overflow-hidden shadow-2xl cursor-pointer" onClick={togglePlay}>
      {/* Video Element that covers full width with minimal important content cropping */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover opacity-60"
        style={{ objectPosition: 'center 40%' }}
        
        loop
        playsInline
      >
        {/* Placeholder video source - replace with your actual video */}
        <source src={collegeVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-8 lg:px-12 pointer-events-none">
        {/* Welcome Text */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white leading-tight">
            Welcome to
          </h1>
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-semibold text-blue-300 leading-tight">
              Central Engineering College
            </h2>
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-8 sm:w-12 md:w-16"></div>
              <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-200 font-light tracking-wide">
                Nepal Technical Institute
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent w-8 sm:w-12 md:w-16"></div>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 md:mt-8 text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 font-light max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl leading-relaxed">
          Building Tomorrow's Engineering and Health Professionals!
        </p>

        {/* Click hint */}
        <div className="mt-4 sm:mt-5 md:mt-6 opacity-70">
          <p className="text-xs sm:text-sm text-white/80 animate-pulse">
            Click anywhere to {isPlaying ? 'pause' : 'play'}
          </p>
        </div>
      </div>

      {/* Decorative Elements - Responsive corner borders */}
      <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 border-l-2 border-t-2 border-white/20"></div>
      <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 border-r-2 border-t-2 border-white/20"></div>
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 border-l-2 border-b-2 border-white/20"></div>
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 border-r-2 border-b-2 border-white/20"></div>
    </div>
  );
}



export default NoticeBar;
