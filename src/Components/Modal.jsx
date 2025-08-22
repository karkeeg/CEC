import React from "react";

const Modal = ({ title, children, onClose, size = "md", contentClassName = "", bodyClassName = "" }) => {
  const sizeClass =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
      ? "max-w-2xl"
      : size === "xl"
      ? "max-w-4xl"
      : "max-w-lg"; // md default

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl w-full ${sizeClass} relative shadow-lg max-h-[90vh] flex flex-col mx-4 ${contentClassName}`}
        style={{ overflow: "visible" }}
      >
        {/* Modal Header */}
        <div className="bg-[#2C7489] text-white text-lg font-semibold px-6 py-4 flex justify-between items-center sticky top-0 z-10 rounded-t-2xl">
          <h2>{title}</h2>
          <button onClick={onClose} className="text-white hover:text-red-200 text-xl">
            ✕
          </button>
        </div>
        {/* Modal Body */}
        <div className={`px-6 py-4 bg-[#EEF0FD] overflow-visible flex-1 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
