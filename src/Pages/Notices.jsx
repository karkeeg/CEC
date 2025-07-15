import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";

const Notices = () => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotices(data || []));
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
            <div className="flex flex-col sm:flex-row items-start bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-md border-l-8 border-transparent p-6 transition-transform hover:scale-[1.025] hover:shadow-2xl relative overflow-hidden">
              {/* Gradient border */}
              <div className="absolute left-0 top-0 h-full w-2 rounded-l-xl bg-gradient-to-b from-blue-500 via-purple-500 to-pink-400" />
              <div className="flex-1 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-lg font-semibold text-blue-900 group-hover:text-purple-700 transition-colors">
                    {notice.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {notice.created_at &&
                      new Date(notice.created_at).toLocaleDateString()}
                  </div>
                </div>
                {notice.description && (
                  <div className="text-gray-600 text-base mt-1 line-clamp-2 leading-relaxed">
                    {notice.description}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Notices;
