import React, { useEffect, useState, useCallback } from "react";
import supabase from "../supabaseConfig/supabaseClient";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  useEffect(() => {
    supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, []);

  const openModal = (idx) => setSelectedIdx(idx);
  const closeModal = () => setSelectedIdx(null);
  const showPrev = useCallback(
    () => setSelectedIdx((idx) => (idx > 0 ? idx - 1 : items.length - 1)),
    [items.length]
  );
  const showNext = useCallback(
    () => setSelectedIdx((idx) => (idx < items.length - 1 ? idx + 1 : 0)),
    [items.length]
  );

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
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-extrabold text-center mb-12 tracking-tight text-blue-900">
        Gallery
      </h1>
      <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="relative mb-6 break-inside-avoid cursor-pointer group rounded-2xl overflow-hidden shadow-lg bg-white transition-transform hover:scale-105 hover:shadow-2xl"
            onClick={() => openModal(idx)}
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-72 object-cover object-center transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="text-white text-xl font-semibold drop-shadow mb-1">
                {item.title}
              </div>
              {item.description && (
                <div className="text-white text-sm line-clamp-2 drop-shadow mb-2">
                  {item.description}
                </div>
              )}
              <div className="text-gray-200 text-xs">
                {item.created_at &&
                  new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {selectedIdx !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          <button
            className="absolute top-6 right-10 text-white text-4xl font-bold hover:text-blue-400 transition-colors"
            onClick={closeModal}
            aria-label="Close"
          >
            &times;
          </button>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white text-4xl font-bold hover:text-blue-400 transition-colors"
            onClick={showPrev}
            aria-label="Previous"
          >
            &#8592;
          </button>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full flex flex-col items-center animate-fade-in">
            <img
              src={items[selectedIdx].image_url}
              alt={items[selectedIdx].title}
              className="max-h-[60vh] w-auto rounded-xl shadow mb-6"
            />
            <div className="text-2xl font-bold text-blue-900 mb-2 text-center">
              {items[selectedIdx].title}
            </div>
            {items[selectedIdx].description && (
              <div className="text-gray-700 text-base mb-2 text-center">
                {items[selectedIdx].description}
              </div>
            )}
            <div className="text-gray-400 text-xs mb-2">
              {items[selectedIdx].created_at &&
                new Date(items[selectedIdx].created_at).toLocaleDateString()}
            </div>
          </div>
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white text-4xl font-bold hover:text-blue-400 transition-colors"
            onClick={showNext}
            aria-label="Next"
          >
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;
