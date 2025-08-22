import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchDownloadCategories,
  fetchDownloadFilesByCategory,
  fetchMoreDownloadFiles,
} from "../supabaseConfig/supabaseApi";
import {
  FaFileAlt,
  FaDownload,
  FaSearch,
  FaFolderOpen,
  FaCopy,
} from "react-icons/fa";
import Loader from "../Components/Loader";

const DownloadPage = () => {
  const { id } = useParams(); // category id
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreDocs, setMoreDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  // UI state
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);
  

  useEffect(() => {
    const fetchCategoryAndFiles = async () => {
      setLoading(true);
      try {
        const cats = await fetchDownloadCategories();
        setCategories(cats || []);
        const catData = (cats || []).find((cat) => String(cat.id) === String(id));
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

  // reset visible count on id change
  useEffect(() => {
    setVisibleCount(9);
    setSearch("");
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

  // Derived lists
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => {
      const name = (f.file_name || "").toLowerCase();
      const desc = (f.description || "").toLowerCase();
      const by = (f.uploaded_by || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || by.includes(q);
    });
  }, [files, search]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading downloads..." />
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

  // Helpers
  const extOf = (name) => {
    const m = (name || "").match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "file";
  };
  const iconFor = (ext) => {
    const common = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "csv", "txt", "png", "jpg", "jpeg", "svg", "mp4", "mp3"]);
    if (!common.has(ext)) return { Icon: FaFileAlt, color: "text-[#1b3e94]" };
    return { Icon: FaFileAlt, color: ext === "pdf" ? "text-red-500" : ext === "zip" || ext === "rar" ? "text-yellow-600" : ext.match(/doc|ppt|xls/) ? "text-green-600" : "text-[#1b3e94]" };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <FaFolderOpen />
            <span>Downloads</span>
            <span>/</span>
            <span className="text-[#1b3e94] font-medium">{category.name}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1b3e94]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-1 text-gray-600 text-base md:text-lg">
              {category.description}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
          {/* Category chooser */}
          <select
            value={String(category?.id || "")}
            onChange={(e) => {
              const newId = e.target.value;
              if (newId) navigate(`/downloads/${newId}`);
            }}
            className="py-2 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3cb4d4]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="pl-9 pr-3 py-2 rounded-md border border-gray-300 w-64 focus:outline-none focus:ring-2 focus:ring-[#3cb4d4]"
            />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#3cb4d4]">Documents</h2>
        {filtered.length === 0 ? (
          <div className="text-gray-500">
            {files.length === 0 ? "No files available for this category." : "No results match your search."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {visible.map((file) => {
                const ext = extOf(file.file_name);
                const { Icon, color } = iconFor(ext);
                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 p-5 flex flex-col transition"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`text-3xl ${color}`}>
                        <Icon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#1b3e94] text-base truncate" title={file.file_name}>
                            {file.file_name}
                          </span>
                        </div>
                        
                        {file.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {file.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-4">
                      Uploaded  on {new Date(file.uploaded_at).toLocaleDateString()}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <a
                        href={file.file_url}
                        className="flex items-center justify-center gap-2 bg-[#3cb4d4] text-white px-4 py-2 rounded hover:bg-[#1b3e94] transition"
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <FaDownload /> Download
                      </a>
                      <button
                        onClick={() => navigator.clipboard && navigator.clipboard.writeText(file.file_url)}
                        className="flex items-center gap-2 px-3 py-2 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                        title="Copy link"
                      >
                        <FaCopy /> Copy link
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {visible.length < filtered.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount((c) => c + 9)}
                  className="px-5 py-2 rounded-md border border-[#3cb4d4] text-[#3cb4d4] hover:bg-[#3cb4d4] hover:text-white transition"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* More Documents Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 text-[#3cb4d4]">More Documents</h2>
        {moreDocs.length === 0 ? (
          <div className="text-gray-400">No more documents available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {moreDocs.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 p-5 flex flex-col transition"
              >
                <div className="flex items-start gap-3 mb-2">
                  <FaFileAlt className="text-[#3cb4d4] text-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#1b3e94] text-base truncate" title={file.file_name}>
                        {file.file_name}
                      </span>
                      {(() => {
                        const catName = (categories.find((c) => String(c.id) === String(file.category_id)) || {}).name;
                        return catName ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                            {catName}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                {file.description && (
                  <div className="text-sm text-gray-600 mb-2">
                    {file.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-3">
                  Uploaded on {new Date(file.uploaded_at).toLocaleDateString()}
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
