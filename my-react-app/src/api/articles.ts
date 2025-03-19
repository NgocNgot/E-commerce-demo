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

// Fetch articles
export const getArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${STRAPI_URL}/api/articles?populate=*`);
    // Check if the response is ok
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

// Create article
// Define the function
export const createArticle = async (
  title: string,
  description: string,
  imageUrl: string
): Promise<boolean> => { // Add the return type of the function
  // Check if the title and description are not empty
  if (!title || !description) {
    alert("Title and Content are required!");
    return false;
  }

  const newArticle = {
    data: {
      title,
      description,
      publishedAt: new Date().toISOString(),
      cover: { url: imageUrl },
    },
  };

  try {
    const response = await fetch(`${STRAPI_URL}/api/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newArticle),
    });

    if (response.ok) {
      alert("Article created successfully!");
      return true;
    } else {
      alert("Failed to create article");
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};

// Delete article
export const deleteArticle = async (id: string): Promise<boolean> => {
  if (!window.confirm("Are you sure you want to delete this article?")) return false;

  try {
    const response = await fetch(`${STRAPI_URL}/api/articles/${id}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting article:", error);
    return false;
  }
};
