import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchDownloadCategories,
  fetchDownloadFilesByCategory,
  fetchMoreDownloadFiles,
} from "../supabaseConfig/supabaseApi";
import { FaFileAlt, FaDownload } from "react-icons/fa";

const DownloadPage = () => {
  const { id } = useParams(); // category id
  const [category, setCategory] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreDocs, setMoreDocs] = useState([]);

  useEffect(() => {
    const fetchCategoryAndFiles = async () => {
      setLoading(true);
      try {
        const categories = await fetchDownloadCategories();
        const catData = categories.find((cat) => cat.id === id);
        setCategory(catData || null);
        if (catData) {
          const fileData = await fetchDownloadFilesByCategory(id);
          setFiles(fileData || []);
        } else {
          setFiles([]);
        }
      } catch (err) {
        setCategory(null);
        setFiles([]);
      }
      setLoading(false);
    };
    fetchCategoryAndFiles();
  }, [id]);

  useEffect(() => {
    const getMoreDocs = async () => {
      try {
        const moreData = await fetchMoreDownloadFiles(id, 3);
        setMoreDocs(moreData || []);
      } catch (err) {
        setMoreDocs([]);
      }
    };
    getMoreDocs();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-lg">
        Loading...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-red-600">
        Category not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#1b3e94]">
          {category.name}
        </h1>
        {category.description && (
          <p className="mb-4 text-gray-600 text-base md:text-lg">
            {category.description}
          </p>
        )}
      </div>
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-[#3cb4d4]">Documents</h2>
        {files.length === 0 ? (
          <div className="text-gray-500">
            No files available for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-md p-5 flex flex-col h-full justify-between border border-gray-100 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FaFileAlt className="text-[#1b3e94] text-2xl" />
                  <span className="font-semibold text-[#1b3e94] text-lg truncate">
                    {file.file_name}
                  </span>
                </div>
                {file.description && (
                  <div className="text-sm text-gray-500 mb-2">
                    {file.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-3">
                  Uploaded by {file.uploaded_by || "Unknown"} on{" "}
                  {new Date(file.uploaded_at).toLocaleDateString()}
                </div>
                <a
                  href={file.file_url}
                  className="mt-auto flex items-center justify-center gap-2 bg-[#3cb4d4] text-white px-4 py-2 rounded hover:bg-[#1b3e94] transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <FaDownload /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* More Documents Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 text-[#3cb4d4]">
          More Documents
        </h2>
        {moreDocs.length === 0 ? (
          <div className="text-gray-400">No more documents available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {moreDocs.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-md p-5 flex flex-col h-full justify-between border border-gray-100 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FaFileAlt className="text-[#3cb4d4] text-2xl" />
                  <span className="font-semibold text-[#1b3e94] text-lg truncate">
                    {file.file_name}
                  </span>
                </div>
                {file.description && (
                  <div className="text-sm text-gray-500 mb-2">
                    {file.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-3">
                  Uploaded by {file.uploaded_by || "Unknown"} on{" "}
                  {new Date(file.uploaded_at).toLocaleDateString()}
                </div>
                <a
                  href={file.file_url}
                  className="mt-auto flex items-center justify-center gap-2 bg-[#3cb4d4] text-white px-4 py-2 rounded hover:bg-[#1b3e94] transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <FaDownload /> Download
                </a>
                <Link
                  to={`/downloads/${file.category_id}`}
                  className="block mt-2 text-xs text-[#3cb4d4] hover:underline text-center"
                >
                  View more in this category
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadPage;
