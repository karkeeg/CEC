import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";

import video from "../assets/collegevodeo.mp4";
import thumbnail from "../assets/thumbnail.png";

const recommendations = [
  {
    id: "2Vv-BfVoq4g",
    thumbnail: "https://img.youtube.com/vi/2Vv-BfVoq4g/0.jpg",
  },
  {
    id: "3JZ_D3ELwOQ",
    thumbnail: "https://img.youtube.com/vi/3JZ_D3ELwOQ/0.jpg",
  },
  {
    id: "l482T0yNkeo",
    thumbnail: "https://img.youtube.com/vi/l482T0yNkeo/0.jpg",
  },
  {
    id: "tgbNymZ7vqY",
    thumbnail: "https://img.youtube.com/vi/tgbNymZ7vqY/0.jpg",
  },
];

const CampusSection = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <div
      className="bg-blue-100 py-12 px-4"
      style={{ backgroundColor: "var(--secondary-100, #CEEAFB)" }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <p className="font-semibold text-sm">Discover</p>
        <h2 className="text-3xl font-bold">
          Discover Our <span className="text-teal-600">Campus</span>
        </h2>
      </div>

      {/* Main Video and Text Section */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-10 max-w-7xl mx-auto">
        {/* Local College Video */}
        <div className="w-full lg:w-1/2 rounded-xl overflow-hidden">
          <div className="aspect-video">
            <video
              className="w-full h-full rounded-xl"
              controls
              src={video}
              poster={thumbnail} // 👈 thumbnail image shown before play
              preload="none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="lg:w-1/2 text-justify">
          <h3 className="text-xl font-semibold mb-4">
            First commitment of our college is <br />
            <span className="text-black italic font-bold">
              "QUALITY EDUCATION IS OUR COMMITMENT"
            </span>
          </h3>
          <p className="text-sm leading-relaxed text-gray-800">
            The NTI/CEC/TEMC Group was started in 1998 with the intent to impart
            quality education in the field of Technical, Engineering, Management
            and Health to equip young people with knowledge and skills, which
            would enable them to make meaningful contribution to the society...
          </p>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-12 max-w-7xl mx-auto">
        <h4 className="font-semibold text-lg mb-4">Recommendation</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map((video, i) => (
            <div
              key={i}
              onClick={() => setSelectedVideo(video.id)}
              className="relative rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={video.thumbnail}
                alt={`Recommendation ${i}`}
                className="w-full h-36 md:h-40 object-cover group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white bg-opacity-70 p-2 rounded-full">
                  <FaPlay size={18} className="text-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Selected Video */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="w-[90%] md:w-[60%] aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
              title="Selected Video"
              frameBorder="0"
              poster={thumbnail}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusSection;
