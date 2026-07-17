"use client";

import { use } from "react";
import PageEditor from "../../editor";

export default function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  return <PageEditor params={Promise.resolve(resolvedParams)} isEdit={true} />;
}
