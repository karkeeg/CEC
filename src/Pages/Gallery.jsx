import React, { useEffect, useState, useCallback } from "react";
import { fetchGalleryItems } from "../supabaseConfig/supabaseApi";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const getGallery = async () => {
      try {
        const data = await fetchGalleryItems();
        setItems(data || []);
        // Extract unique categories
        const cats = (data || []).map((g) => g.category).filter(Boolean);
        setCategories([...new Set(cats)]);
      } catch (err) {
        setItems([]);
      }
    };
    getGallery();
  }, []);

  // Helper to get all images/videos for an item
  const getMediaArr = (item) => {
    let arr = [];
    try {
      arr =
        typeof item.image_url === "string"
          ? JSON.parse(item.image_url)
          : item.image_url;
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
    return arr;
  };

  // For modal: which image/video is selected in the current item
  const [modalMediaIdx, setModalMediaIdx] = useState(0);

  const openModal = (idx, mediaIdx = 0) => {
    setSelectedIdx(idx);
    setModalMediaIdx(mediaIdx);
  };
  const closeModal = () => setSelectedIdx(null);
  const showPrev = useCallback(() => {
    setModalMediaIdx((idx) => {
      const mediaArr = getMediaArr(items[selectedIdx]);
      return idx > 0 ? idx - 1 : mediaArr.length - 1;
    });
  }, [items, selectedIdx]);
  const showNext = useCallback(() => {
    setModalMediaIdx((idx) => {
      const mediaArr = getMediaArr(items[selectedIdx]);
      return idx < mediaArr.length - 1 ? idx + 1 : 0;
    });
  }, [items, selectedIdx]);

  // Keyboard navigation for modal
  useEffect(() => {
    if (selectedIdx === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIdx, showPrev, showNext]);

  return (
    <section className="bg-[#F7F9FB] min-h-screen py-12 px-4 md:px-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1b3e94] mb-8 text-center">
          Gallery
        </h1>
        <div className="flex flex-wrap justify-center mb-8 gap-4">
          <select
            className="border border-blue-300 rounded px-4 py-2 text-blue-900 bg-white shadow focus:outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-2">
          {items
            .filter(
              (item) => !selectedCategory || item.category === selectedCategory
            )
            .map((item, idx) => {
              const mediaArr = getMediaArr(item);
              const preview = mediaArr[0];
              return (
                <div
                  key={item.id}
                  className="relative group bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer min-h-[400px] h-[420px]"
                  onClick={() => openModal(idx, 0)}
                >
                  {/* Full-size image/video preview */}
                  <div className="absolute inset-0 w-full h-full">
                    {preview &&
                      (preview.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={preview}
                          controls
                          className="w-full h-full object-cover bg-black rounded-3xl"
                        />
                      ) : (
                        <img
                          src={preview}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-3xl"
                        />
                      ))}
                    {/* Overlay for multiple images */}
                    {mediaArr.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded-full">
                        +{mediaArr.length - 1} more
                      </div>
                    )}
                  </div>
                  {/* Bottom overlay text with enhanced animation */}
                  <div className="absolute bottom-0 left-0 w-full px-8 py-6 flex flex-col items-start z-10 pointer-events-none">
                    <div
                      className="text-3xl font-extrabold text-white mb-2 opacity-40 group-hover:opacity-100 group-hover:-translate-y-2 group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.7)] transition-all duration-500 drop-shadow-lg transform"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
                    >
                      {item.title}
                    </div>
                    <div
                      className="text-lg text-white opacity-30 group-hover:opacity-90 group-hover:-translate-y-1 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-500 drop-shadow-lg transform"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {/* Modal */}
        {selectedIdx !== null && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-0 max-w-4xl w-full relative flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large image/video with navigation */}
              <div className="relative w-full flex items-center justify-center min-h-[60vh] bg-black">
                <button
                  onClick={showPrev}
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FaChevronLeft className="text-2xl text-blue-700" />
                </button>
                {(() => {
                  const mediaArr = getMediaArr(items[selectedIdx]);
                  const media = mediaArr[modalMediaIdx];
                  if (!media) return null;
                  if (media.match(/\.(mp4|webm|ogg)$/i)) {
                    return (
                      <video
                        src={media}
                        controls
                        autoPlay
                        className="w-full max-h-[80vh] object-contain rounded-xl transition-all duration-300"
                      />
                    );
                  }
                  return (
                    <img
                      src={media}
                      alt={items[selectedIdx].title}
                      className="w-full max-h-[80vh] object-contain rounded-xl transition-all duration-300"
                    />
                  );
                })()}
                <button
                  onClick={showNext}
                  aria-label="Next"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FaChevronRight className="text-2xl text-blue-700" />
                </button>
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-red-200 rounded-full p-2 z-20 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <FaTimes className="text-lg text-red-600" />
                </button>
              </div>
              {/* Dot indicators for multiple images/videos */}
              {getMediaArr(items[selectedIdx]).length > 1 && (
                <div className="flex justify-center gap-2 mt-4 mb-2">
                  {getMediaArr(items[selectedIdx]).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setModalMediaIdx(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        modalMediaIdx === i
                          ? "bg-blue-600 border-blue-600"
                          : "bg-gray-300 border-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}
              <h2 className="text-xl font-bold mb-2 text-[#1b3e94] text-center w-full px-4">
                {items[selectedIdx].title}
              </h2>
              <p className="text-gray-600 mb-4 text-center w-full px-4">
                {items[selectedIdx].description}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
