import React from "react";
import { FaBell } from "react-icons/fa";
import avatar from "../../assets/logo.png";

const Header = ({ name = "Student" }) => {
  return (
    <header className="fixed top-0 left-64 right-0 z-50 flex justify-between items-center pl-10 pr-12 py-5 bg-[#1E449D] text-white shadow">
      <h1 className="text-xl font-semibold">Welcome back, {name}!</h1>
      <div className="flex items-center gap-4">
        <FaBell className="text-white text-lg cursor-pointer" />
        <img
          src={avatar}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover border-2 border-white"
        />
      </div>
    </header>
  );
};

export default Header;
