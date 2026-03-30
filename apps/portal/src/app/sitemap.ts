import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/api';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hongyishi.cn';
  
  // 获取所有博客文章
  const posts = getAllPosts();
  
  // 博客文章页面
  const blogPosts = posts.map((post) => ({
    url: `${baseUrl}/blog/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogPosts,
  ];
}

