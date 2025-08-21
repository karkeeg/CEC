import React, { useState } from "react";
import { FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import emailjs from "emailjs-com";
import Swal from 'sweetalert2';

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    emailjs
      .send(
        "service_nhdcjry",
        "template_z430wpr",
        formData,
        "oyORtlfQbRmDt0zE5"
      )
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Message sent successfully!',
          customClass: {
            popup: 'swal-small'
          }
        });
        setFormData({ name: "", email: "", message: "" });
      })
      .catch((err) => {
        console.error("EmailJS error:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to send message.',
          customClass: {
            popup: 'swal-small'
          }
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <footer className="bg-[#1f459f] text-white w-full">
      <div
        className="max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-wrap gap-16 px-6 md:px-12 lg:px-[120px] py-[64px]"
        style={{ minHeight: "460px" }}
      >
        {/* LEFT SECTION */}
        <div className="flex flex-col gap-10 flex-1 min-w-[300px]">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src={logo}
                alt="Central Engineering College"
                className="w-32 md:w-40 h-auto"
              />
            </div>

            {/* {/* Title - Description  */}
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-xl mb-1">
                  Central Engineering College
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed max-w-md">
                  Pioneering technical education in Nepal, we blend knowledge,
                  practice, and purpose to shape tomorrow's engineering leaders.
                </p>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Stay Connected</p>
                <div className="flex gap-4">
                  
  <a
    href="https://www.facebook.com/cecjanakpurdham/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Facebook"
  >
    <FaFacebookF className="text-xl cursor-pointer hover:text-blue-500 transition" />
  </a>
  <a
    href="https://www.youtube.com/@centralengineeringcollege"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="YouTube"
  >
    <FaYoutube className="text-xl cursor-pointer hover:text-red-500 transition" />
  </a>

                </div>
              </div>
            </div>
          </div>

          {/* Map - Contact Info */}
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src="https://lca.logcluster.org/sites/default/files/inline-images/image-20240517124357-1.jpeg"
              alt="Map"
              className="rounded-lg w-[140px] h-[140px] object-cover"
            />
            <div className="text-sm leading-relaxed space-y-1">
              <p>
                <strong>Head Office:</strong> Janakpur Dham-8, Dhanusa, Nepal
              </p>
              <p>Phone: 041-527336</p>
              <p>Phone: 041-528593</p>
              <p>Mobile: 9801048617 / 9854021897</p>
              <p>Fax: 041-528594</p>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex flex-col lg:flex-row flex-1 min-w-[300px] gap-10">
          {/* Quick Links */}
          <div className="flex-1">
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm font-semibold text-gray-300">
              <li>
                <a href="#">INTRODUCTION</a>
              </li>
              <li>
                <a href="#">ADMISSIONS</a>
              </li>
              <li>
                <a href="#">DOWNLOADS</a>
              </li>
              <li>
                <a href="#">NOTICE</a>
              </li>
            </ul>
          </div>

          {/* Inquiry Form */}
          <div className="w-full lg:w-[431px] h-auto lg:h-[307px] pl-[24px] lg:pl-[40px] pr-[16px] pb-[8px] border-t lg:border-t-0 lg:border-l border-gray-400 flex flex-col gap-6">
            <h4 className="text-lg font-bold mb-2">Inquiry / Feedback</h4>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                className="w-full bg-[#3f75b2] text-white px-4 py-2 rounded-md placeholder-white outline-none"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                className="w-full bg-[#3f75b2] text-white px-4 py-2 rounded-md placeholder-white outline-none"
                required
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Inquiry/Feedback"
                rows="3"
                className="w-full bg-[#3f75b2] text-white px-4 py-2 rounded-md placeholder-white outline-none resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#55b6c2] text-white font-semibold py-2 px-6 rounded-md self-start hover:bg-[#49aab5] transition"
              >
                {submitting ? "Sending..." : "Send Us"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
