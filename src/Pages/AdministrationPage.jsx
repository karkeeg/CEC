import React from "react";

const admins = [
  {
    name: "Dr. Suman Sharma",
    position: "Principal",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Dr. Sharma has over 20 years of experience in academic administration and is dedicated to fostering a culture of excellence.",
  },
  {
    name: "Ms. Anita Karki",
    position: "Vice Principal",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Ms. Karki is passionate about student development and leads several key initiatives at the college.",
  },
  {
    name: "Mr. Rajesh Thapa",
    position: "Administrative Officer",
    image: "https://randomuser.me/api/portraits/men/65.jpg",
    bio: "Mr. Thapa ensures smooth operations and manages the administrative staff with efficiency and care.",
  },
];

const AdministrationPage = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1b3e94] text-center">
        Administrative Team
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {admins.map((admin, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center border border-gray-100 hover:shadow-lg transition"
          >
            <img
              src={admin.image}
              alt={admin.name}
              className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-[#3cb4d4]"
            />
            <h2 className="text-xl font-semibold text-[#1b3e94] mb-1">
              {admin.name}
            </h2>
            <div className="text-[#3cb4d4] font-medium mb-2">
              {admin.position}
            </div>
            <p className="text-gray-600 text-center text-sm">{admin.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdministrationPage;
