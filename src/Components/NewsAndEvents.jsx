import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseConfig/supabaseClient";

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  return { day, month };
}

const NewsAndEvents = () => {
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

  const mainArticle = articles[0];
  const suggestedArticles = articles.slice(1, 3); 
  const newsArticles = articles.slice(0, 9); 

  return (
    <section className="bg-[#E8EBFC] py-12 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        {/* Heading */}
        <div className="text-center">
          <p className="font-semibold text-sm mb-2">Latest News and Events</p>
          <h2 className="font-extrabold text-3xl">
            What’s <span className="text-blue-700">Poppin’</span> at CEC
          </h2>
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left News List */}
          <div className="bg-white rounded-2xl p-8 mt-2 shadow-sm w-full lg:w-1/2">
            {loading ? (
              <div className="text-gray-500">Loading news...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : newsArticles.length === 0 ? (
              <div className="text-gray-500">No news found.</div>
            ) : (
              <ul className="space-y-6">
                {newsArticles.map((article) => {
                  const { day, month } = formatDate(article.created_at);
                  return (
                    <li key={article.slug} className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center bg-[#D5EBFF] rounded-lg w-14 h-14 flex-shrink-0">
                        <span className="font-bold text-sm">{day}</span>
                        <span className="text-xs">{month}</span>
                      </div>
                      <Link to={`/articles/${article.slug}`} className="flex-1">
                        <div className="font-semibold text-gray-800 leading-snug hover:underline">
                          {article.title}
                        </div>
                        <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {article.summary}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              View All
            </button>
          </div>

          {/* Right Article */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            {loading ? (
              <div className="p-10 text-center text-xl">Loading article...</div>
            ) : error ? (
              <div className="p-10 text-center text-red-600">{error}</div>
            ) : mainArticle ? (
              <>
                {/* Main Article Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02]">
                  {mainArticle.image && (
                    <img
                      className="object-cover w-full h-64 sm:h-72 lg:h-80"
                      src={mainArticle.image}
                      alt={mainArticle.title}
                    />
                  )}
                  <div className="p-6 flex flex-col gap-2">
                    <p className="uppercase font-bold text-xs text-gray-400 mb-1">
                      {mainArticle.title}
                    </p>
                    <h3 className="font-bold text-2xl mb-2 text-[#1b3e94]">
                      {mainArticle.title}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                      {mainArticle.summary}
                    </p>
                    <Link
                      to={`/articles/${mainArticle.slug}`}
                      className="self-start px-4 py-2 bg-[#1b3e94] text-white rounded-full font-semibold shadow hover:bg-[#2a4bd7] transition"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
                {/* Suggested Articles Section */}
                <div className="border-t mt-4 pt-4 px-2">
                  <h4 className="font-bold text-lg mb-3 text-[#1b3e94]">
                    Suggested Articles
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {suggestedArticles.map((article) => (
                      <Link
                        to={`/articles/${article.slug}`}
                        key={article.slug}
                        className="block bg-white rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1 p-3"
                      >
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-28 object-cover rounded mb-2"
                          />
                        )}
                        <div className="font-bold text-base mb-1 text-[#1b3e94]">
                          {article.title}
                        </div>
                        <div className="text-gray-700 text-xs">
                          {article.summary}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-xl">No articles found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsAndEvents;
