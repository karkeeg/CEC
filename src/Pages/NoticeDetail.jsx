import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";

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
    return <div className="p-10 text-center text-xl">Loading...</div>;
  if (!notice)
    return (
      <div className="p-10 text-center text-red-600">Notice not found.</div>
    );

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link
        to="/notices"
        className="text-blue-700 hover:underline mb-4 inline-block"
      >
        &larr; Back to Notices
      </Link>
      <div className="bg-white rounded-xl shadow p-8">
        <div className="text-xs text-gray-400 mb-2">
          {notice.created_at &&
            new Date(notice.created_at).toLocaleDateString()}
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          {notice.title}
        </h1>
        {notice.images && (
          <img
            src={notice.images}
            alt={notice.title}
            className="w-full max-h-96 object-contain rounded mb-4"
          />
        )}
        {notice.description && (
          <div className="text-gray-700 mb-4">{notice.description}</div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetail;
