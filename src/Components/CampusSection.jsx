import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";

import video from "../assets/collegevodeo.mp4";
import thumbnail from "../assets/thumbnail.png";

const recommendations = [
  {
    id: "v=8RDua_bgnrU",
    thumbnail: "https://www.youtube.com/watch?v=0TsMvE31Gb0",
  },
  {
    id: "v=UGDmXED-bSA",
    thumbnail: "https://www.youtube.com/watch?v=UGDmXED-bSA",
  },
  {
    id: "l482T0yNkeo",
    thumbnail: "https://www.youtube.com/watch?v=dqFxbk3rw1w",
  },
  {
    id: "tgbNymZ7vqY",
    thumbnail: "https://www.youtube.com/watch?v=8RDua_bgnrU",
  },
];

const CampusSection = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Extracts YouTube video ID from various URL formats
  const extractYouTubeId = (urlOrId) => {
    if (!urlOrId) return null;
    // Handle raw query-like value e.g., "v=VIDEO_ID"
    if (/^v=/.test(urlOrId)) {
      return urlOrId.split("v=")[1];
    }
    // Already an ID (no slashes, no query, and not containing '=')
    if (!urlOrId.includes("/") && !urlOrId.includes("?") && !urlOrId.includes("=")) return urlOrId;
    try {
      const url = new URL(urlOrId);
      // https://www.youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get("v");
      if (v) return v;
      // https://youtu.be/VIDEO_ID
      if (url.hostname.includes("youtu.be")) {
        return url.pathname.replace("/", "");
      }
      // https://www.youtube.com/embed/VIDEO_ID
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/")[2];
      }
    } catch (e) {
      // Not a URL, fallback
      return urlOrId;
    }
    return null;
  };

  return (
    <div
      id="campus-section"
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
          {recommendations.map((rec, i) => {
            const vid = extractYouTubeId(rec.id) || extractYouTubeId(rec.thumbnail);
            const thumbUrl = rec.thumbnail && rec.thumbnail.includes("youtube.com")
              ? `https://img.youtube.com/vi/${extractYouTubeId(rec.thumbnail)}/hqdefault.jpg`
              : rec.thumbnail;
            return (
            <div
              key={i}
              onClick={() => vid && setSelectedVideo(vid)}
              className="relative rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={thumbUrl}
                alt={`Recommendation ${i}`}
                className="w-full h-36 md:h-40 object-cover group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white bg-opacity-70 p-2 rounded-full">
                  <FaPlay size={18} className="text-gray-800" />
                </div>
              </div>
            </div>
            );
          })}
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
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&mute=1`}
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
