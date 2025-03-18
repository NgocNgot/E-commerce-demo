import { useEffect, useState } from "react";
import CreateArticle from "./components/CreateArticle";
// Interface mô tả cấu trúc dữ liệu bài viết từ Strapi
// Create Article Interface
export interface Article {
  id: string;
  title: string;
  content: string;
  cover: { url: string };
  publishedAt: Date;
}

// Define Strapi URL
const STRAPI_URL = "http://localhost:1337";
// Component chính
export default function App() {

  // State lưu trữ danh sách bài viết
  const [articles, setArticles] = useState<Article[]>([]);

  // fetch articles
  const getArticles = async () => {
    const response = await fetch(`${STRAPI_URL}/api/articles?populate=*`);
    const data = await response.json();
    setArticles(data.data);
  };
  //delete
  const deleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    try {
      // Xóa bài viết
      const response = await fetch(`${STRAPI_URL}/api/articles/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setArticles((prev) => prev.filter((article) => article.id !== id));
      } else {
        alert("Failed to delete article");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };


  // Format date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(date).toLocaleDateString("en-US", options);
  };
  // Gọi API khi component mount
  useEffect(() => {
    getArticles();
  }, []);

  // Hiển thị danh sách bài viết
  return (
    <div className="p-6">
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
                src={article.cover ? STRAPI_URL + article.cover.url : "/placeholder.jpg"}
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
              {/* Nút Delete article */}
              <button
                onClick={() => deleteArticle(article.id)}
                className="bottom-0 left-0 bg-red-500 text-white px-4 py-2 text-sm rounded-b-lg hover:bg-red-700 w-100"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </div>
      {/* Nút Create article */}
      <CreateArticle onArticleCreated={getArticles} />
    </div>
  );
}
