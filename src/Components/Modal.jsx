import React from "react";

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div
      className="bg-white rounded-2xl w-full max-w-lg relative shadow-lg"
      style={{ overflow: "visible" }}
    >
      {/* Modal Header */}
      <div className="bg-[#2C7489] text-white text-lg font-semibold px-6 py-4 flex justify-between items-center">
        <h2>{title}</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-red-200 text-xl"
        >
          ✕
        </button>
      </div>
      {/* Modal Body */}
      <div className="px-6 py-4 bg-[#EEF0FD]">{children}</div>
    </div>
  </div>
);

export default Modal;
