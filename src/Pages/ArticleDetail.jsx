import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";
import Loader from "../Components/Loader";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", id)
        .maybeSingle();
      const { data: allData, error: allError } = await supabase
        .from("articles")
        .select("*");
      if (articleError || allError) {
        setError(articleError?.message || allError?.message);
        setArticle(null);
        setAllArticles([]);
      } else {
        setArticle(articleData);
        setAllArticles(allData);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading article..." />
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!article)
    return <div className="p-10 text-center text-2xl">Article not found.</div>;

  return (
    <section className="flex flex-col items-center py-12 px-4 bg-[#F7F9FB] min-h-screen">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8">
        {article.image && (
          <div className="flex-shrink-0 flex justify-center items-start">
            <img
              src={article.image}
              alt={article.title}
              className="w-96 h-96 object-cover rounded-lg shadow"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#1b3e94]">
              {article.title}
            </h1>
            <Link
              to="/articles"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Articles
            </Link>
          </div>
          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-line mb-6">
            {article.full_content}
          </div>
          {article.files && article.files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-[#1b3e94] mb-3">Attached Files:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {article.files.map((fileUrl, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    {fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img src={fileUrl} alt={`File ${index + 1}`} className="w-full h-32 object-contain mb-2 rounded" />
                    ) : fileUrl.match(/\.pdf$/i) ? (
                      <iframe src={fileUrl} className="w-full h-32 mb-2 rounded" title={`PDF Preview ${index + 1}`}></iframe>
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-500 rounded mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h.008v.008H8.25m0-12.75h.008v.008H8.25M19.5 18.75h-2.625c-1.01 0-1.905-.596-2.331-1.442a2.25 2.25 0 00-2.181-1.114H9.75m0-6H5.625c-1.01 0-1.905.596-2.331 1.442A2.25 2.25 0 003 15.375v5.625m7.5-15h2.25m-4.5 0H3M12 18.75h9" />
                        </svg>
                      </div>
                    )}
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-center break-all"
                    >
                      {article.title}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {article.signature && (
            <div className="text-right text-gray-700 font-semibold mt-8">
              {article.signature}
            </div>
          )}
        </div>
      </div>
      {/* Suggested Articles */}
      <div className="max-w-3xl w-full mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-4 text-[#1b3e94]">
          Other Articles
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {allArticles
            .filter((a) => a.slug !== id)
            .map((a) => (
              <Link
                to={`/articles/${a.slug}`}
                key={a.slug}
                className="block bg-white rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1 p-4"
              >
                {a.image && (
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-28 object-cover rounded mb-2"
                  />
                )}
                <div className="font-bold text-base mb-1 text-[#1b3e94]">
                  {a.title}
                </div>
                <div className="text-gray-700 text-xs">{a.summary}</div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
};

export default ArticleDetail;
