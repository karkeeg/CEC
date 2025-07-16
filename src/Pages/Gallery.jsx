import React, { useEffect, useState, useCallback } from "react";
import { fetchGalleryItems } from "../supabaseConfig/supabaseApi";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  useEffect(() => {
    const getGallery = async () => {
      try {
        const data = await fetchGalleryItems();
        setItems(data || []);
      } catch (err) {
        setItems([]);
      }
    };
    getGallery();
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
    <section className="bg-[#F7F9FB] min-h-screen py-12 px-4 md:px-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1b3e94] mb-8 text-center">
          Gallery
        </h1>
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
              onClick={() => openModal(idx)}
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-40 object-cover rounded mb-2"
              />
              <h2 className="text-lg font-bold mb-1 text-[#1b3e94]">
                {item.title}
              </h2>
              <p className="text-gray-600 text-sm text-center">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        {/* Modal */}
        {selectedIdx !== null && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={items[selectedIdx].image_url}
                alt={items[selectedIdx].title}
                className="w-full h-80 object-cover rounded mb-4"
              />
              <h2 className="text-xl font-bold mb-2 text-[#1b3e94]">
                {items[selectedIdx].title}
              </h2>
              <p className="text-gray-600 mb-4">
                {items[selectedIdx].description}
              </p>
              <div className="flex justify-between">
                <button
                  onClick={showPrev}
                  className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
                >
                  Prev
                </button>
                <button
                  onClick={showNext}
                  className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
                >
                  Next
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-red-100 rounded hover:bg-red-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
