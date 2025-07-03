import React from "react";

const newsItems = [
  {
    date: "24",
    month: "Jun",
    text: "Applications are now open for Bachelor in Civil Engineering and Diploma Programs. Limited...",
  },
  {
    date: "24",
    month: "Jun",
    text: "Our engineering students won 1st place in the National Civil Model Competition hosted in K...",
  },
  {
    date: "24",
    month: "Jun",
    text: "Our engineering students won 1st place in the National Civil Model Competition hosted in K...",
  },
  {
    date: "24",
    month: "Jun",
    text: "A 3-day intensive workshop for Diploma and Bachelor students, certified by industry expe...",
  },
  {
    date: "24",
    month: "Jun",
    text: "A 3-day intensive workshop for Diploma and Bachelor students, certified by industry expe...",
  },
];

const NewsAndEvents = () => {
  return (
    <section className="bg-[#E8EBFC] py-12 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        {/* Heading */}
        <div className="text-center">
          <p className="font-semibold text-sm mb-2">Latest News and Events</p>
          <h2 className="font-extrabold text-3xl">
            What’s <span className="text-blue-700">Poppin’</span> at CEC
          </h2>
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left News List */}
          <div className="bg-white rounded-2xl p-8 mt-2 shadow-sm w-full lg:w-1/2">
            <ul className="space-y-6">
              {newsItems.map(({ date, month, text }, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center bg-[#D5EBFF] rounded-lg w-14 h-14 flex-shrink-0">
                    <span className="font-bold text-sm">{date}</span>
                    <span className="text-xs">{month}</span>
                  </div>
                  <p className="font-semibold text-gray-800 leading-snug cursor-pointer hover:underline">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
            <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              View All
            </button>
          </div>

          {/* Right Article */}

          <div className="bg-white rounded-2xl shadow-sm w-full lg:w-1/2 overflow-hidden">
            <div className="p-3 pb-0">
              <p className="uppercase text-center font-bold text-xl text-gray-700 ">
                ARTICLE
              </p>
            </div>

            <img
              className="object-cover w-full p-5 h-58 sm:h-72 lg:h-80"
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
              alt="Person cheering outside"
            />

            <div className="p-6">
              <p className="uppercase font-bold text-xs text-gray-400 mb-2">
                USER STORY
              </p>
              <h3 className="font-bold text-xl mb-2">
                Why Choose Nepal for Your Higher Education?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Choosing Nepal for your higher education offers a unique blend
                of quality academics, cultural richness, and affordability. With
                a growing number of universities and colleges offering diverse
                programs in various fields, students can fi…
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsAndEvents;
