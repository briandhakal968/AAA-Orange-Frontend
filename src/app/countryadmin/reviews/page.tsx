"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { countryAdminFetch } from "@/lib/country-admin-api";

interface Review {
  id: number;
  product_id: number;
  user_id: number | null;
  country_id: number | null;
  rating: number;
  comment: string | null;
  status: string;
  is_verified_purchase: boolean;
  created_at: string;
  author_name?: string;
  product?: { id: number; name: string; image: string | null };
  user?: { id: number; name: string; email: string };
  country?: { id: number; name: string; flag: string };
}

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default function CountryAdminReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [user, setUser] = useState<{ name: string; country_id: number; country?: { name: string; flag: string; currency_symbol: string } } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("country_admin_user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        router.push("/countryadmin/login");
      }
    } else {
      router.push("/countryadmin/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        const response = await countryAdminFetch(`/country-admin/reviews?${params}`);
        if (!response) return;
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchReviews();
  }, [user, statusFilter]);

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const stats = {
    total: reviews.length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    pending: reviews.filter((r) => r.status === "pending").length,
  };

  const handleApprove = async (review: Review) => {
    try {
      const response = await countryAdminFetch(`/country-admin/reviews/${review.id}/approve`, {
        method: "PUT",
      });
      if (!response) return;
      if (response.ok) {
        setReviews(reviews.map((r) => (r.id === review.id ? { ...r, status: "approved" } : r)));
      }
    } catch (err) {
      console.error("Error approving review:", err);
    }
  };

  const handleReject = async (review: Review) => {
    try {
      const response = await countryAdminFetch(`/country-admin/reviews/${review.id}/reject`, {
        method: "PUT",
      });
      if (!response) return;
      if (response.ok) {
        setReviews(reviews.map((r) => (r.id === review.id ? { ...r, status: "rejected" } : r)));
      }
    } catch (err) {
      console.error("Error rejecting review:", err);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const response = await countryAdminFetch(`/country-admin/reviews/${review.id}`, {
        method: "DELETE",
      });
      if (!response) return;
      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== review.id));
        if (showViewModal) setShowViewModal(false);
      }
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-amber-400" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Manage product reviews for your country</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Total Reviews</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Approved</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-400 via-pink-500 to-red-600 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Rejected</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
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
                placeholder="Search by product or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No reviews found</td>
                </tr>
              ) : (
                paginatedReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {review.product?.image && (
                          <img src={review.product.image} alt={review.product.name} className="w-10 h-10 object-cover rounded-lg bg-slate-100" />
                        )}
                        <span className="font-medium text-slate-800 text-sm">{review.product?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{review.author_name || review.user?.name || "Anonymous"}</p>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">{renderStars(review.rating)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[review.status]}`}>
                          {review.status}
                        </span>
                        {review.status === "pending" && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(review)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={() => handleReject(review)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedReview(review); setShowViewModal(true); }}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(review)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReviews.length > reviewsPerPage && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * reviewsPerPage + 1} to {Math.min(currentPage * reviewsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
            </p>
            <div className="flex gap-1">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Previous</button>
              {currentPage > 2 && (
                <>
                  <button onClick={() => handlePageChange(1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">1</button>
                  {currentPage > 3 && <span className="px-2 py-1.5 text-slate-400">...</span>}
                </>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                .map((page) => (
                  <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === page ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{page}</button>
                ))}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && <span className="px-2 py-1.5 text-slate-400">...</span>}
                  <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">{totalPages}</button>
                </>
              )}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Next</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Review Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Product</p>
                <p className="font-medium text-slate-800">{selectedReview.product?.name || "Unknown"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Customer</p>
                  <p className="font-medium text-slate-800">{selectedReview.author_name || selectedReview.user?.name || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Rating</p>
                  <div>{renderStars(selectedReview.rating)}</div>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Comment</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedReview.comment || "No comment"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[selectedReview.status]}`}>{selectedReview.status}</span>
                {selectedReview.is_verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified Purchase
                  </span>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                {selectedReview.status === "pending" && (
                  <>
                    <button onClick={() => { handleApprove(selectedReview); setShowViewModal(false); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                    <button onClick={() => { handleReject(selectedReview); setShowViewModal(false); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Reject</button>
                  </>
                )}
                <button onClick={() => handleDelete(selectedReview)} className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
