export interface Product {
  documentId: string;
  title: string;
  slug: string;
  description?: string | { children: { text: string }[] }[];
  media: { url: string }[];
  pricing: { price: number };
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  body: string;
  categories?: { documentId: string; slug: string; name: string }[];
}
