import { Metadata } from "next";
import Link from "next/link";
import { RichTextContent } from "@/components/ui/rich-text-content";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.aaaorange.com";

interface PageData {
  id: number;
  title: string;
  slug: string;
  content: string;
  use_breadcrumb: boolean;
  banner_heading: string | null;
  banner_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

async function getPage(slug: string): Promise<PageData | null> {
  try {
    const res = await fetch(`${API_URL}/api/pages/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(params.slug);
  if (!page) return { title: "Page Not Found" };
  return {
    title: page.seo_title || `${page.title} | AAA Orange`,
    description: page.seo_description || "",
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await getPage(resolvedParams.slug);

  if (!page) {
    return (
      <div className="flex-1">
        <div className="max-w-4xl mx-auto py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Page Not Found</h1>
          <p className="text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const heading = page.banner_heading || page.title;

  return (
    <div className="flex-1">
      <div
        className="relative flex items-center justify-center"
        style={{ height: "300px" }}
      >
        {page.banner_image ? (
          <>
            <img
              src={page.banner_image}
              alt={heading}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
        )}
        <h1 className="relative text-4xl md:text-5xl font-bold text-white text-center px-4">
          {heading}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {page.use_breadcrumb && (
          <nav className="flex items-center gap-2 text-sm text-slate-500 py-3 border-b border-slate-200">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-800 font-medium">{page.title}</span>
          </nav>
        )}

        <div className="py-8">
          <RichTextContent html={page.content} />
        </div>
      </div>
    </div>
  );
}
