import Link from "next/link";
import { Container } from "@/components/ui/container";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  status: string;
  category: { id: number; name: string; slug: string } | null;
  author: { id: number; name: string } | null;
  views: number;
  published_at: string;
  reading_time?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  posts_count: number;
}

interface BlogResponse {
  data: Post[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

async function getPosts(page: number, search?: string): Promise<BlogResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    if (search) params.append("search", search);

    const res = await fetch(`${API_URL}/api/blog?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], current_page: 1, last_page: 1, per_page: 12, total: 0 };
    return res.json();
  } catch {
    return { data: [], current_page: 1, last_page: 1, per_page: 12, total: 0 };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/blog-categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function getReadingTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";

  const [postsData, categories] = await Promise.all([
    getPosts(page, search || undefined),
    getCategories(),
  ]);

  const posts = postsData.data.map((post) => ({
    ...post,
    reading_time: getReadingTime(post.excerpt || ""),
  }));

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white py-16 md:py-24">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">
              Our Blog
            </p>
            <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
              Stories & Insights
            </h1>
            <p className="text-white/80 text-lg">
              Discover the latest trends, style guides, and inspiration from the world of fashion.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-12 md:py-16">
          <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="lg:col-span-3 lg:border-r lg:border-neutral-200 lg:pr-12">
              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-neutral-500 text-lg">No articles found.</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group block bg-white rounded-xl overflow-hidden border border-neutral-100 hover:shadow-lg transition-shadow"
                      >
                        {post.featured_image && (
                          <div className="aspect-[16/10] overflow-hidden">
                            <img
                              src={post.featured_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          {post.category && (
                            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--primary)] font-medium">
                              {post.category.name}
                            </span>
                          )}
                          <h2 className="text-lg font-medium text-black mt-1 mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>
                              {post.published_at
                                ? new Date(post.published_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : ""}
                            </span>
                            <span>{post.reading_time} min read</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {postsData.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      {page > 1 && (
                        <Link
                          href={`/blog?${new URLSearchParams({ ...(search && { search }), page: (page - 1).toString() })}`}
                          className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-sm"
                        >
                          Previous
                        </Link>
                      )}
                      {Array.from({ length: postsData.last_page }, (_, i) => i + 1).map((p) => (
                        <Link
                          key={p}
                          href={`/blog?${new URLSearchParams({ ...(search && { search }), page: p.toString() })}`}
                          className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center ${
                            page === p
                              ? "bg-[var(--primary)] text-white"
                              : "border border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          {p}
                        </Link>
                      ))}
                      {page < postsData.last_page && (
                        <Link
                          href={`/blog?${new URLSearchParams({ ...(search && { search }), page: (page + 1).toString() })}`}
                          className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-sm"
                        >
                          Next
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <aside className="space-y-8">
              <div className="bg-neutral-100 rounded-xl border border-neutral-200 p-6">
                <form action="/blog" method="get" className="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search articles..."
                    defaultValue={search}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none bg-white"
                  />
                  <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>

              <div className="bg-neutral-100 rounded-xl border border-neutral-200 p-6">
                <h3 className="text-sm font-medium text-black mb-4">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/blog"
                      className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors block bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                    >
                      All Posts
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/blog/category/${cat.slug}`}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-neutral-600 hover:bg-neutral-50"
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
        </div>
      </Container>
    </main>
  );
}
