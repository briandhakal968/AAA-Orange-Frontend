"use client";

import { useState, useEffect, useRef } from "react";
import { Container } from "@/components/ui/container";
import { Star, Trash2, Check, X, Eye, ChevronLeft, ChevronRight, MessageSquare, ThumbsUp, ThumbsDown, Clock } from "lucide-react";

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

interface Country {
  id: number;
  name: string;
  flag: string;
}

interface ReviewCounts {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "rejected" | "pending">("all");
  const [countryFilter, setCountryFilter] = useState<number | "all">("all");
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reviewCounts, setReviewCounts] = useState<ReviewCounts>({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const tableRef = useRef<HTMLDivElement>(null);

  const totalReviews = reviews.length;
  const pendingReviews = reviewCounts.pending;
  const approvedReviews = reviewCounts.approved;
  const rejectedReviews = reviewCounts.rejected;

  const getCountryStats = () => {
    const stats: Record<string, { count: number; flag: string }> = {};
    reviews.forEach(r => {
      const c = r.country?.name || "Unknown";
      if (!stats[c]) stats[c] = { count: 0, flag: r.country?.flag || "" };
      stats[c].count++;
    });
    return stats;
  };
  const countryStats = getCountryStats();

  useEffect(() => {
    fetchCountries();
    fetchReviewCounts();
    fetchReviews();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [filter, countryFilter]);

  const fetchReviewCounts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("auth_token");
      const headers = { "Authorization": "Bearer " + token, "Accept": "application/json" };
      
      const allRes = await fetch(API_URL + "/api/admin/reviews", { headers });
      const approvedRes = await fetch(API_URL + "/api/admin/reviews?status=approved", { headers });
      const rejectedRes = await fetch(API_URL + "/api/admin/reviews?status=rejected", { headers });
      const pendingRes = await fetch(API_URL + "/api/admin/reviews?status=pending", { headers });
      
      const allData = await allRes.json();
      const approvedData = await approvedRes.json();
      const rejectedData = await rejectedRes.json();
      const pendingData = await pendingRes.json();
      
      setReviewCounts({
        total: allData.reviews?.length || allData.length || 0,
        approved: approvedData.reviews?.length || approvedData.length || 0,
        rejected: rejectedData.reviews?.length || rejectedData.length || 0,
        pending: pendingData.reviews?.length || pendingData.length || 0,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const fetchCountries = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/countries`);
      if (response.ok) setCountries(await response.json());
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("auth_token");
      let url = filter === "all" ? `${API_URL}/api/admin/reviews` : `${API_URL}/api/admin/reviews?status=${filter}`;
      if (countryFilter !== "all") url += `${url.includes('?') ? '&' : '?'}country_id=${countryFilter}`;
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/admin/reviews/${id}/approve`, { 
        method: "PUT", 
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" } 
      });
      if (response.ok) {
        await fetchReviews();
        await fetchReviewCounts();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to approve review");
      }
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Failed to approve review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/admin/reviews/${id}/reject`, { 
        method: "PUT", 
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" } 
      });
      if (response.ok) {
        await fetchReviews();
        await fetchReviewCounts();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to reject review");
      }
    } catch (error) {
      console.error("Error rejecting review:", error);
      alert("Failed to reject review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setActionLoading(id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/admin/reviews/${id}`, { 
        method: "DELETE", 
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" } 
      });
      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== id));
        if (selectedReview?.id === id) { setShowModal(false); setSelectedReview(null); }
        await fetchReviewCounts();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    } finally {
      setActionLoading(null);
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!tableRef.current) return;
    tableRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filterCards = [
    { key: "all", label: "Total", count: reviewCounts.total, icon: MessageSquare, bg: "from-indigo-600 to-purple-700" },
    { key: "approved", label: "Approved", count: reviewCounts.approved, icon: ThumbsUp, bg: "from-emerald-500 to-teal-600" },
    { key: "rejected", label: "Rejected", count: reviewCounts.rejected, icon: ThumbsDown, bg: "from-red-500 to-rose-600" },
    { key: "pending", label: "Pending", count: reviewCounts.pending, icon: Clock, bg: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and moderate customer reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filterCards.map(({ key, label, count, icon: Icon, bg }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`bg-gradient-to-br ${bg} rounded-2xl p-5 text-white text-left relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${
              filter === key ? "ring-4 ring-black/20" : ""
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-white/80" />
                <span className="text-white/80 text-sm font-medium">{label}</span>
              </div>
              <p className="text-4xl font-bold">{count}</p>
              <p className="text-white/70 text-xs mt-1">{label.toLowerCase()} reviews</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (<option key={c.id} value={c.id}>{c.flag} {c.name}</option>))}
        </select>
        
        {Object.keys(countryStats).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(countryStats).map(([country, { count, flag }]) => {
              const cid = countries.find(c => c.name === country)?.id ?? 0;
              return (
                <button
                  key={country}
                  onClick={() => setCountryFilter(cid === countryFilter ? "all" : (cid || "all"))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    cid === countryFilter
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {flag} {country}: <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No reviews found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="relative">
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div ref={tableRef} className="overflow-x-auto min-w-0">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {review.product?.image ? (
                            <img src={review.product.image} alt={review.product.name} className="w-10 h-10 object-cover rounded-lg" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"><span className="text-slate-400 text-xs">No</span></div>
                          )}
                          <span className="text-sm font-medium text-slate-800 truncate max-w-[150px]">{review.product?.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{review.user?.name || review.author_name || "Anonymous"}</p>
                        {review.user?.email && <p className="text-xs text-slate-500">{review.user.email}</p>}
                        {review.is_verified_purchase && <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="w-2.5 h-2.5" /> Verified</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-slate-300"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>{review.status}</span>
                          <div className="flex gap-1">
                            {review.status !== "approved" && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleApprove(review.id); }} 
                                disabled={actionLoading === review.id}
                                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50" 
                                title="Quick Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {review.status !== "rejected" && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleReject(review.id); }} 
                                disabled={actionLoading === review.id}
                                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50" 
                                title="Quick Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          {review.country?.flag} {review.country?.name || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(review.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => { setSelectedReview(review); setShowModal(true); }} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(review.id)} 
                            disabled={actionLoading === review.id} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Review Details</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-xl">
                {selectedReview.product?.image ? (
                  <img src={selectedReview.product.image} alt={selectedReview.product.name} className="w-20 h-20 object-cover rounded-xl" />
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center"><span className="text-slate-400 text-xs">No img</span></div>
                )}
                <div>
                  <p className="font-semibold text-lg text-slate-800">{selectedReview.product?.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-5 h-5 ${star <= selectedReview.rating ? "fill-yellow-400 text-yellow-400" : "fill-none text-slate-300"}`} />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">{new Date(selectedReview.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
                  <p className="font-medium text-slate-800">{selectedReview.user?.name || selectedReview.author_name || "Anonymous"}</p>
                  {selectedReview.user?.email && <p className="text-sm text-slate-500">{selectedReview.user.email}</p>}
                  {selectedReview.is_verified_purchase && <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2"><Check className="w-3 h-3" /> Verified Purchase</span>}
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                  <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusColor(selectedReview.status)}`}>{selectedReview.status}</span>
                </div>
              </div>

              {selectedReview.comment && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Review</p>
                  <p className="text-slate-700 leading-relaxed">{selectedReview.comment}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {selectedReview.status !== "approved" && (
                  <button onClick={async () => { await handleApprove(selectedReview.id); setShowModal(false); }} className="flex-1 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                    Approve
                  </button>
                )}
                {selectedReview.status !== "rejected" && (
                  <button onClick={async () => { await handleReject(selectedReview.id); setShowModal(false); }} className="flex-1 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                    Reject
                  </button>
                )}
                <button onClick={() => handleDelete(selectedReview.id)} className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}