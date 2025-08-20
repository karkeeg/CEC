import React, { useEffect, useState, useRef } from "react";
import { fetchNoticeTitles } from "../supabaseConfig/supabaseApi";
import { Link } from "react-router-dom";
import collegeVideo from "../assets/collegeVideo.mp4"

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
        <div className="w-full h-[720px] overflow-hidden">
          <VideoSection />
        </div>
      </section>
    </>
  );
};

function VideoSection() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Handle play/pause
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

  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // Handle picture-in-picture
  const togglePiP = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.log('Picture-in-Picture not supported or failed:', error);
      }
    }
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Handle progress
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Format time
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  return (
    <div 
      className="w-full h-full relative group bg-black rounded-lg overflow-hidden shadow-2xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        loop
        playsInline
        onClick={togglePlay}
      >
        <source src={collegeVideo} type="video/mp4" />
        {/* <source src="/path-to-your-video.webm" type="video/webm" /> */}
        Your browser does not support the video tag.
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Play/Pause Overlay */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={togglePlay}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 rounded-full p-4 transform hover:scale-110"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>
      </div>

      {/* Bottom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer progress-bar"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="text-white hover:text-blue-400 transition-colors duration-200"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors duration-200"
              title="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}

export default NoticeBar;
