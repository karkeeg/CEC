import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";
import img1 from "../assets/image1.png";
import img2 from "../assets/person.png";
import img3 from "../assets/logo.png";

const carouselImages = [img1, img2, img3];

function parseHashParams() {
  const hash = window.location.hash.substr(1);
  const params = {};
  hash.split("&").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) params[key] = decodeURIComponent(value);
  });
  return params;
}

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get query params for email and role
  const params = new URLSearchParams(location.search);
  const prefillEmail = params.get("email") || "";
  const prefillRole = params.get("role") || "student";
  const [email, setEmail] = useState(prefillEmail);
  const [role, setRole] = useState(prefillRole);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // On mount, check for access_token and refresh_token in URL hash
    const { access_token, refresh_token } = parseHashParams();
    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) setMessage(error.message || "Session error");
          // setSessionReady(true); // This state is no longer needed
          setLoading(false);
        });
    } else {
      // setMessage("Invalid or expired reset link. Please try again.");
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email || !newPassword || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      // Update password in the selected table
      const { error } = await supabase
        .from(
          role === "student"
            ? "students"
            : role === "teacher"
            ? "teachers"
            : "admins"
        )
        .update({ hashed_password: newPassword })
        .eq("email", email);
      if (error) throw error;
      setMessage("Password changed successfully! You can now log in.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setMessage(err.message || "An error occurred.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-2"
      style={{
        background: "linear-gradient(135deg, #4f8edc 0%, #3bb6c1 100%)",
      }}
    >
      <div className="flex flex-col md:flex-row w-full max-w-2xl md:max-w-4xl h-auto md:h-[550px] bg-white bg-opacity-80 mb-10 rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="w-full md:w-1/2 h-56 xs:h-72 sm:h-80 md:h-full flex flex-col items-center justify-center relative bg-black/10">
          <img
            src={carouselImages[current]}
            alt="Classroom"
            className="object-cover w-full h-full transition-all duration-700"
          />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 xs:gap-3 z-10">
            {carouselImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full border-2 border-white bg-white transition-all duration-300 ${
                  current === idx
                    ? "bg-blue-400 border-blue-500 scale-110"
                    : "opacity-60"
                }`}
              />
            ))}
          </div>
        </div>
        {/* Change Password Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 xs:px-6 sm:px-8 py-6 sm:py-8 bg-[#f5f6fa]">
          <img
            src={img3}
            alt="Logo"
            className="h-20 w-20 xs:h-28 xs:w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 mb-4"
          />
          <h2 className="text-lg xs:text-xl font-semibold mb-2 text-center">
            Set a New Password
          </h2>
          {loading ? (
            <div className="w-full flex justify-center items-center py-8">
              <span className="text-blue-600 font-semibold text-lg">
                Loading...
              </span>
            </div>
          ) : (
            <form
              className="w-full flex flex-col gap-3 xs:gap-4 mt-2"
              onSubmit={handleSubmit}
              noValidate
            >
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full bg-white text-gray-700 focus:outline-none text-sm xs:text-base"
                disabled={!!prefillRole}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="email"
                placeholder="Your Email"
                className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#6ed0e0] bg-white text-sm xs:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!prefillEmail}
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#6ed0e0] bg-white text-sm xs:text-base"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#6ed0e0] bg-white text-sm xs:text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-[#b6e6fa] text-gray-800 font-semibold py-2 xs:py-3 rounded-full mt-2 hover:bg-[#6ed0e0] transition disabled:opacity-60 disabled:cursor-not-allowed text-sm xs:text-base"
                disabled={loading}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
              {message && (
                <div className="mt-2 text-green-600 text-center text-sm">
                  {message}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
