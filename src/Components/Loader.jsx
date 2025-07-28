import React from "react";
import "./Loader.css";

const Loader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px]">
    <div className="loader" />
    <span className="mt-4 text-lg text-gray-600 animate-pulse">{message}</span>
  </div>
);

export default Loader;
