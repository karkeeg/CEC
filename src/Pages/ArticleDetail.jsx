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
          <h1 className="text-3xl font-bold text-[#1b3e94] mb-4">
            {article.title}
          </h1>
          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-line mb-6">
            {article.full_content}
          </div>
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
