import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchNotices } from "../supabaseConfig/supabaseApi";

const Notices = () => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const getNotices = async () => {
      try {
        const data = await fetchNotices();
        setNotices(data || []);
      } catch (err) {
        setNotices([]);
      }
    };
    getNotices();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-12 text-blue-900">
        Notices
      </h1>
      <div className="flex flex-col gap-8">
        {notices.length === 0 && (
          <div className="p-8 text-center text-gray-500">No notices found.</div>
        )}
        {notices.map((notice) => (
          <Link
            to={`/notices/${notice.notice_id}`}
            key={notice.id}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow p-6 group-hover:bg-blue-50 transition">
              <h2 className="text-xl font-bold mb-2 text-[#1b3e94]">
                {notice.title}
              </h2>
              <p className="text-gray-700 mb-2">{notice.description}</p>
              <div className="text-xs text-gray-400">
                {new Date(notice.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Notices;
