import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";
import { fetchStudents, fetchTeachers } from "../supabaseConfig/supabaseApi";
import img1 from "../assets/image1.png";
import img2 from "../assets/person.png";
import img3 from "../assets/logo.png";

const carouselImages = [img1, img2, img3];

const ForgotPassword = () => {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [adminTargetEmail, setAdminTargetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSelect = (idx) => {
    setCurrent(idx);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (role === "admin") {
        setMessage("Admin password reset is not implemented in this demo.");
      } else {
        let exists = false;
        if (role === "student") {
          const students = await fetchStudents();
          exists = students.some((s) => s.email === email);
        } else if (role === "teacher") {
          const teachers = await fetchTeachers();
          exists = teachers.some((t) => t.email === email);
        }
        if (!exists) {
          setMessage("No user found with this email for the selected role.");
          setLoading(false);
          return;
        }
        // Commenting out Supabase Auth reset for now:
        /*
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/change-password",
        });
        if (error) throw error;
        setMessage("If the email exists, a reset link has been sent.");
        */
        // Instead, redirect to Change Password page with email and role as query params
        window.location.href = `/change-password?email=${encodeURIComponent(
          email
        )}&role=${encodeURIComponent(role)}`;
        return;
      }
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
                onClick={() => handleSelect(idx)}
                className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full border-2 border-white bg-white transition-all duration-300 ${
                  current === idx
                    ? "bg-blue-400 border-blue-500 scale-110"
                    : "opacity-60"
                }`}
              />
            ))}
          </div>
        </div>
        {/* Forgot Password Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 xs:px-6 sm:px-8 py-6 sm:py-8 bg-[#f5f6fa]">
          <img
            src={img3}
            alt="Logo"
            className="h-20 w-20 xs:h-28 xs:w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 mb-4"
          />
          <h2 className="text-lg xs:text-xl font-semibold mb-2 text-center">
            Forgot your password?
          </h2>
          <form
            className="w-full flex flex-col gap-3 xs:gap-4 mt-2"
            onSubmit={handleSubmit}
            noValidate
          >
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full bg-white text-gray-700 focus:outline-none text-sm xs:text-base"
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
            />
            {role === "admin" && (
              <input
                type="email"
                placeholder="User Email to Reset"
                className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#6ed0e0] bg-white text-sm xs:text-base"
                value={adminTargetEmail}
                onChange={(e) => setAdminTargetEmail(e.target.value)}
                required
              />
            )}
            <button
              type="submit"
              className="w-full bg-[#b6e6fa] text-gray-800 font-semibold py-2 xs:py-3 rounded-full mt-2 hover:bg-[#6ed0e0] transition disabled:opacity-60 disabled:cursor-not-allowed text-sm xs:text-base"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-left ml-2 mb-1">
              <Link
                to="/login"
                className="text-xs text-gray-500 hover:underline"
              >
                Back to Login
              </Link>
            </div>
            {message && (
              <div className="mt-2 text-green-600 text-center text-sm">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
