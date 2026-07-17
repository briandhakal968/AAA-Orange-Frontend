"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { RichTextContent } from "@/components/ui/rich-text-content";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  status: string;
  category: { id: number; name: string; slug: string } | null;
  author: { id: number; name: string } | null;
  views: number;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  reading_time?: number;
}

interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: { id: number; name: string; slug: string } | null;
  published_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  posts_count: number;
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestPosts, setLatestPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/blog/${resolvedParams.slug}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data.post);
          setRelated(data.related || []);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/blog-categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchLatest = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/blog/recent?limit=5`);
        if (res.ok) {
          const data = await res.json();
          setLatestPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Error fetching latest posts:", error);
      }
    };

    fetchPost();
    fetchCategories();
    fetchLatest();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <main className="flex-1">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex-1">
        <Container>
          <div className="py-20 text-center">
            <h1 className="text-2xl font-light mb-4">Post not found</h1>
            <Link href="/blog" className="text-sm underline text-[var(--primary)]">
              Back to Blog
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white py-10 md:py-14">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="inline-block text-[10px] uppercase tracking-[0.15em] text-white bg-white/20 px-3 py-1 rounded-full mb-3"
              >
                {post.category.name}
              </Link>
            )}
            <h1 className="text-xl md:text-3xl lg:text-4xl font-light text-white tracking-tight">
              {post.title}
            </h1>
          </div>
        </Container>
      </section>

      <Container>
        <div className="pt-8 md:pt-12">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Content */}
            <article className="lg:col-span-8 lg:border-r lg:border-neutral-200 lg:pr-12">
              {/* Featured Image */}
              {post.featured_image && (
                <div className="aspect-[16/10] rounded-xl overflow-hidden mb-6">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-neutral-500">
                {post.published_at && (
                  <span>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span>{post.reading_time || 5} min read</span>
                <span>{post.views} views</span>
              </div>

              {post.excerpt && (
                <p className="text-lg text-neutral-600 leading-relaxed mb-8 pb-8 border-b border-neutral-100">
                  {post.excerpt}
                </p>
              )}
              <RichTextContent html={post.content} />
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Latest Posts */}
              {latestPosts.length > 0 && (
                <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-black mb-4">Latest Posts</h3>
                  <ul className="space-y-4">
                    {latestPosts
                      .filter((lp) => lp.slug !== post?.slug)
                      .slice(0, 5)
                      .map((lp) => (
                        <li key={lp.id}>
                          <Link
                            href={`/blog/${lp.slug}`}
                            className="group flex gap-3 items-start"
                          >
                            {lp.featured_image && (
                              <div className="w-16 h-10 rounded-md overflow-hidden flex-shrink-0 bg-neutral-200">
                                <img
                                  src={lp.featured_image}
                                  alt={lp.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-black group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug">
                                {lp.title}
                              </h4>
                              {lp.published_at && (
                                <p className="text-xs text-neutral-400 mt-1">
                                  {new Date(lp.published_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Categories */}
              <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-6">
                <h3 className="text-sm font-medium text-black mb-4">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/blog"
                      className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors block text-neutral-600 hover:bg-neutral-50"
                    >
                      All Posts
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/blog/category/${cat.slug}`}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                          post?.category?.slug === cat.slug
                            ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                            : "text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-neutral-400">{cat.posts_count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

            </aside>
          </div>

          {/* Related Posts */}
          {related.length > 0 && (
            <div className="mt-16 pt-12 border-t border-neutral-100">
              <h2 className="text-2xl font-light tracking-tight mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="group block"
                  >
                    {r.featured_image && (
                      <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3">
                        <img
                          src={r.featured_image}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    {r.category && (
                      <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--primary)] font-medium">
                        {r.category.name}
                      </span>
                    )}
                    <h3 className="text-sm font-medium text-black mt-1 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
