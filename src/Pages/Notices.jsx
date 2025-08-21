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

  // Helper to get preview image
  const getPreviewImage = (notice) => {
    let filesArr = [];
    try {
      filesArr =
        typeof notice.files === "string"
          ? JSON.parse(notice.files)
          : notice.files;
      if (!Array.isArray(filesArr)) filesArr = [];
    } catch {
      filesArr = [];
    }
    return filesArr.length > 0 ? filesArr[0] : null;
  };

  // Helper to check if notice is new (less than 3 days old)
  const isNew = (created_at) => {
    if (!created_at) return false;
    const created = new Date(created_at);
    const now = new Date();
    const diff = (now - created) / (1000 * 60 * 60 * 24);
    return diff < 3;
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-2 sm:px-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center mb-12 text-blue-900 tracking-tight drop-shadow-lg">
        Notices
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {notices.length === 0 && (
          <div className="p-8 text-center text-gray-500 col-span-full">
            No notices found.
          </div>
        )}
        {notices.map((notice) => {
          const preview = getPreviewImage(notice);
          return (
            <Link
              to={`/notices/${notice.notice_id}`}
              key={notice.notice_id}
              className="group focus:outline-none"
            >
              <div className="relative bg-white rounded-2xl shadow-lg border border-blue-100 hover:border-blue-400 transition p-0 flex flex-col h-full overflow-hidden">
                {preview && (
                  <img
                    src={preview}
                    alt={notice.title}
                    className="w-full h-40 object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-200"
                  />
                )}
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-[#1b3e94] flex-1 group-hover:text-blue-700 transition-colors">
                      {notice.title}
                    </h2>
                    {isNew(notice.created_at) && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">
                        New notice
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-3 flex-1">
                    {notice.description}
                  </p>
                  <div className="text-xs text-gray-400 mt-auto flex items-center gap-2">
                    <span>
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Notices;
