import { useEffect, useState } from "react";
import CreateArticle from "./components/CreateArticle";
import { Helmet } from "react-helmet"; //Manage SEO
import { getArticles, deleteArticle, Article } from "./api/articles";

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => {
    getArticles().then(setArticles);
  }, []);

  const handleDelete = async (id: string) => {
    const success = await deleteArticle(id);
    if (success) {
      setArticles((prev) => prev.filter((article) => article.id !== id));
    } else {
      alert("Failed to delete article");
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  return (
    <div className="p-6">
      <Helmet>
        <title>React.js and Strapi Integration</title>
        <meta
          name="description"
          content="React.js and Strapi Integration - List of articles"
        />
      </Helmet>
      <h1 className="text-4xl font-bold mb-8">React.js and Strapi Integration</h1>
      <div>
        <h2 className="text-2xl font-semibold mb-6">Articles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <img
                className="w-full h-48 object-cover"
                src={article.cover ? "http://localhost:1337" + article.cover.url : "/placeholder.jpg"}
                alt={article.title}
                width={180}
                height={38}
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                <p className="text-gray-600 mb-4">{article.content}</p>
                <p className="text-sm text-gray-500">
                  Published: {formatDate(article.publishedAt)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(article.id)}
                className="bottom-0 left-0 bg-red-500 text-white px-4 py-2 text-sm rounded-b-lg hover:bg-red-700 w-100"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </div>
      <CreateArticle onArticleCreated={() => getArticles().then(setArticles)} />
    </div>
  );
}
