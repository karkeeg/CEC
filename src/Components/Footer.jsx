import React from "react";
import { FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const Footer = () => {
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
                  <Link
                    to={{
                      pathname: "https://www.facebook.com/cecjanakpurdham/",
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <FaFacebookF className="text-xl cursor-pointer hover:text-blue-500 transition" />
                  </Link>
                  <Link
                    to={{
                      pathname:
                        "https://www.youtube.com/@centralengineeringcollege",
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                  >
                    <FaYoutube className="text-xl cursor-pointer hover:text-red-500 transition" />
                  </Link>
                  <Link
                    to={{
                      pathname:
                        "https://www.instagram.com/centralengineeringcollege",
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="text-xl cursor-pointer hover:text-pink-500 transition" />
                  </Link>
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
            <form className="flex flex-col space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full bg-[#3f75b2] text-white px-4 py-2 rounded-md placeholder-white outline-none"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full bg-[#3f75b2] text-white px-4 py-2 rounded-md placeholder-white outline-none"
              />
              <textarea
                rows="3"
                placeholder="Inquiry/Feedback"
                className="w-full bg-[#3f75b2] text-white px-4 py-2 rounded-md placeholder-white outline-none resize-none"
              ></textarea>
              <button
                type="submit"
                className="bg-[#55b6c2] text-white font-semibold py-2 px-6 rounded-md self-start hover:bg-[#49aab5] transition"
              >
                Send Us
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
