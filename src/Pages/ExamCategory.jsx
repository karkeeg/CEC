import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";
import { fetchExamItems } from "../supabaseConfig/supabaseApi";

const ExamCategory = () => {
  const { id } = useParams(); // category id
  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // fetch category detail
        const { data: catData, error: catErr } = await supabase
          .from("exam_category")
          .select("id, category_name")
          .eq("id", id)
          .single();
        if (catErr) throw catErr;
        setCategory(catData);

        // fetch items for this category
        const itemsData = await fetchExamItems({ category: id, limit: 1000 });
        setItems(itemsData || []);
      } catch (e) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const totalFiles = (files) => {
    if (!files) return 0;
    if (Array.isArray(files)) return files.length;
    return 1;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1b3e94]">
          {category ? category.category_name : "Exams"}
        </h1>
        <p className="text-gray-600 mt-1">All items and files for this category.</p>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3">
          No exam items found for this category.
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded shadow p-4 border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Details</h2>
                <p className="text-gray-700 whitespace-pre-line mt-1">{item.details}</p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-medium text-gray-800">Files ({totalFiles(item.files)})</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(item.files) ? (
                  item.files.map((url, idx) => (
                    <a
                      key={idx}
                      className="px-3 py-1 bg-[#eef1fa] text-[#1b3e94] rounded hover:bg-[#e4e8fb] text-sm break-all"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      File {idx + 1}
                    </a>
                  ))
                ) : item.files ? (
                  <a
                    className="px-3 py-1 bg-[#eef1fa] text-[#1b3e94] rounded hover:bg-[#e4e8fb] text-sm break-all"
                    href={item.files}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View File
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm">No files</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamCategory;
