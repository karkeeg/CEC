import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
        setArticles([]);
      } else {
        setArticles(data);
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  if (loading)
    return <div className="p-10 text-center text-xl">Loading articles...</div>;
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;

  return (
    <section className="bg-[#F7F9FB] min-h-screen py-12 px-4 md:px-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1b3e94] mb-8 text-center">
          Articles & Stories
        </h1>
        <div className="grid gap-8 md:grid-cols-2">
          {articles.map((article) => (
            <div
              key={article.slug}
              className="bg-white rounded-lg shadow p-6 flex flex-col h-full"
            >
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-40 object-cover rounded mb-4"
              />
              <h2 className="text-xl font-bold mb-2">{article.title}</h2>
              <p className="text-gray-700 mb-4 flex-1">{article.summary}</p>
              <Link
                to={`/articles/${article.slug}`}
                className="inline-block mt-auto px-4 py-2 bg-[#1b3e94] text-white rounded-full font-semibold shadow hover:bg-[#2a4bd7] transition"
              >
                Read More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Articles;
