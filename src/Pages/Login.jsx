import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";
import img1 from "../assets/image 19.png";
import img2 from "../assets/person.png";
import img3 from "../assets/logo.png";
import Swal from "sweetalert2";

const carouselImages = [img1, img2, img3];

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("Admin");
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required.";
    else if (!validateEmail(email))
      newErrors.email = "Enter a valid email address.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const result = await Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "User not found or invalid credentials. Do you want to register instead?",
          showCancelButton: true,
          confirmButtonText: "Register",
          cancelButtonText: "Try Again",
        });

        if (result.isConfirmed) {
          navigate("/register");
        }
      } else {
        const user = data.user;
        const role = user?.user_metadata?.role?.toLowerCase();

        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "student") navigate("/student/dashboard");
        else if (role === "teacher") navigate("/teacher");
        else navigate("/");
      }
    }
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

        {/* Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 xs:px-6 sm:px-8 py-6 sm:py-8 bg-[#f5f6fa]">
          <img
            src={img3}
            alt="Logo"
            className="h-20 w-20 xs:h-28 xs:w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 mb-4"
          />
          <h2 className="text-lg xs:text-xl font-semibold mb-2 text-center">
            Hey there! Let's get you in
          </h2>
          <form
            className="w-full flex flex-col gap-3 xs:gap-4 mt-2"
            onSubmit={handleSubmit}
            noValidate
          >
            <div>
              <input
                type="email"
                placeholder="Your Email"
                className={`w-full p-4 xs:p-3 border ${
                  errors.email && touched.email
                    ? "border-red-400"
                    : "border-[#6ed0e0]"
                } rounded-full focus:outline-none focus:ring-2 focus:ring-[#6ed0e0] bg-white text-sm xs:text-base`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
              />
              {errors.email && touched.email && (
                <div className="text-red-500 text-xs mt-1 ml-2">
                  {errors.email}
                </div>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className={`w-full p-4 xs:p-3 border ${
                  errors.password && touched.password
                    ? "border-red-400"
                    : "border-[#6ed0e0]"
                } rounded-full focus:outline-none focus:ring-2 focus:ring-[#6ed0e0] bg-white text-sm xs:text-base`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
              />
              {errors.password && touched.password && (
                <div className="text-red-500 text-xs mt-1 ml-2">
                  {errors.password}
                </div>
              )}
            </div>

            <div className="text-left -mt-2 xs:-mt-4 ml-2 mb-1">
              <a
                href="/forgot-password"
                className="text-xs text-gray-500 hover:underline"
              >
                Forget Password?
              </a>
            </div>

            {/* <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 xs:p-3 border border-[#6ed0e0] rounded-full bg-white text-gray-700 focus:outline-none text-sm xs:text-base"
            >
              <option>Admin</option>
              <option>Student</option>
              <option>Faculty</option>
            </select> */}

            <button
              type="submit"
              className="w-full bg-[#b6e6fa] text-gray-800 font-semibold py-2 xs:py-3 rounded-full mt-2 hover:bg-[#6ed0e0] transition disabled:opacity-60 disabled:cursor-not-allowed text-sm xs:text-base"
            >
              Continue
            </button>
            <p>
              Haven't you registered yet ? <Link to={"/register"}>Go on!</Link>{" "}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
