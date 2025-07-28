import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";
import Loader from "../Components/Loader";

const NoticeDetail = () => {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("notices")
      .select("*")
      .eq("notice_id", id)
      .single()
      .then(({ data }) => {
        setNotice(data);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading notice..." />
      </div>
    );
  if (!notice)
    return (
      <div className="p-10 text-center text-red-600">Notice not found.</div>
    );

  // Parse files field if it's a JSON string
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-10 px-2 sm:px-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-l-8 border-blue-500 p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-6 pb-2">
          <Link
            to="/notices"
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-base sm:text-lg transition-colors"
          >
            <span className="text-xl">←</span> <span>Back</span>
          </Link>
          <span className="ml-auto text-xs sm:text-sm text-gray-400 font-medium">
            {notice.created_at &&
              new Date(notice.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
          </span>
        </div>
        <div className="px-6 pb-6 pt-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-4 tracking-tight leading-tight">
            {notice.title}
          </h1>
          {filesArr.length > 0 && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filesArr.map((url, idx) => (
                <div
                  key={idx}
                  className="w-full h-56 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center"
                >
                  <img
                    src={url}
                    alt={notice.title}
                    className="object-contain w-full h-full transition-transform duration-200 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
          {notice.description && (
            <div className="text-gray-700 text-lg leading-relaxed mb-2 whitespace-pre-line">
              {notice.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;
