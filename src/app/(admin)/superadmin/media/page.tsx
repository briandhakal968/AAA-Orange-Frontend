"use client";

import { useState, useEffect, useRef } from "react";
import { adminApi } from "@/lib/admin-api";

interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  extension: string;
  size: number;
  url: string;
  thumbnail: string;
  created_at: string;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterType !== "all") params.append("type", filterType);
      params.append("page", currentPage.toString());

      const res = await adminApi.get<any>(`/admin/media?${params}`);
      const data = res.data || [];
      
      setMedia(Array.isArray(data) ? data : []);
      if (res.current_page) {
        setPagination(res);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    fetchMedia();
  }, [searchTerm, filterType, currentPage]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files[]", files[i]);
      }

      await adminApi.postFormData("/admin/media/multiple", formData);

      fetchMedia();
    } catch (error) {
      console.error("Error uploading:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await adminApi.delete(`/admin/media/${id}`);
      fetchMedia();
      setShowModal(false);
      setSelectedMedia(null);
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Media Library</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your images and files ({media.length} files)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3v0a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4l4 4" />
            </svg>
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading media...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500">No files found. Upload some files to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedMedia(item);
                setShowModal(true);
              }}
              className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                {item.mime_type?.startsWith("image/") ? (
                  <>
                    <img
                      src={item.url}
                      alt={item.file_name || item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.classList.add('hidden');
                        const placeholder = target.parentElement?.querySelector('.image-placeholder');
                        if (placeholder) placeholder.classList.remove('hidden');
                      }}
                    />
                    <div className="image-placeholder hidden absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-800 truncate">{item.file_name || item.name}</p>
                <p className="text-xs text-slate-500">{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Showing {pagination.from} to {pagination.to} of {pagination.total} files
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {(() => {
              const pages = [];
              const total = pagination.last_page;
              const current = currentPage;
              
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 3) pages.push(-1);
                const start = Math.max(2, current - 1);
                const end = Math.min(total - 1, current + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (current < total - 2) pages.push(-1);
                pages.push(total);
              }
              
              return pages.map((page, idx) => {
                if (page === -1) {
                  return <span key={`e-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400">...</span>;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              });
            })()}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.last_page))}
              disabled={currentPage === pagination.last_page}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(pagination.last_page)}
              disabled={currentPage === pagination.last_page}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showModal && selectedMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">{selectedMedia.file_name || selectedMedia.name}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                {selectedMedia.mime_type?.startsWith("image/") ? (
                  <>
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.file_name || selectedMedia.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.classList.add('hidden');
                        const placeholder = target.parentElement?.querySelector('.modal-image-placeholder');
                        if (placeholder) placeholder.classList.remove('hidden');
                      }}
                    />
                    <div className="modal-image-placeholder hidden absolute inset-0 flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-slate-500">Image preview not available</p>
                    </div>
                  </>
                ) : (
                  <video src={selectedMedia.url} controls className="max-w-full max-h-full" />
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">File Name</label>
                  <p className="text-sm text-slate-800">{selectedMedia.file_name || selectedMedia.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">File Type</label>
                  <p className="text-sm text-slate-800">{selectedMedia.mime_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Size</label>
                  <p className="text-sm text-slate-800">{formatSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedMedia.url}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
                    />
                    <button
                      onClick={() => copyUrl(selectedMedia.url)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => handleDelete(selectedMedia.id)}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}