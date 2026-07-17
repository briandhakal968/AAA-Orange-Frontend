"use client";

import { use } from "react";
import BlogPostEditor from "../../editor";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <BlogPostEditor params={Promise.resolve(resolvedParams)} isEdit={true} />;
}
