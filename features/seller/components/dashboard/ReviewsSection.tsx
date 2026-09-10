'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Star, AlertCircle, CheckCircle, Send, Flag, ShoppingBag } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';

export interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  user: string;
  time: string;
  replied: boolean;
  replyContent: string;
  productName: string;
  sku: string;
  orderId: string;
  verified: boolean;
}

interface ReviewsSectionProps {
  reviewList: ReviewItem[];
  onReplySubmit: (id: number, text: string) => void;
}

export function ReviewsSection({ reviewList, onReplySubmit }: ReviewsSectionProps) {
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [replyActiveMap, setReplyActiveMap] = useState<Record<number, boolean>>({});
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);

  // Regression: starDistribution/averageRating/"Sentiment Score" were
  // previously hardcoded constants (180/26/5/1/0, "94% Positive... Based on
  // 50 reviews") completely disconnected from the reviewList actually
  // rendered below them — a seller with 3 real reviews saw stats implying
  // 212. These are now derived from the real reviewList prop. The fake
  // "AI-analyzed sentiment" claim is replaced with a plainly-computed,
  // honest proxy metric (share of reviews rated 4★ or higher) rather than
  // asserting an analysis capability that doesn't exist.
  const starDistribution = useMemo(() => {
    const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviewList) {
      const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) dist[rating] += 1;
    }
    return dist;
  }, [reviewList]);

  const totalReviews = reviewList.length;

  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = reviewList.reduce((acc, review) => acc + review.rating, 0);
    return sum / totalReviews;
  }, [reviewList, totalReviews]);

  const positiveSharePercent = useMemo(() => {
    if (totalReviews === 0) return 0;
    const positiveCount = reviewList.filter((review) => review.rating >= 4).length;
    return Math.round((positiveCount / totalReviews) * 100);
  }, [reviewList, totalReviews]);

  const handleToggleReply = (id: number) => {
    setReplyActiveMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendReply = (id: number) => {
    const text = replyTextMap[id] || '';
    if (!text.trim()) return;
    onReplySubmit(id, text);
    setReplyActiveMap((prev) => ({ ...prev, [id]: false }));
    setReplyTextMap((prev) => ({ ...prev, [id]: '' }));
  };

  const filteredReviews = selectedRatingFilter
    ? reviewList.filter((r) => r.rating === selectedRatingFilter)
    : reviewList;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header Title */}
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-white">Recent Customer Reviews</h3>
          <p className="text-xs text-slate-400">Manage customer feedback, ratings, and replies</p>
        </div>

        {/* Rating Breakdown & Sentiment score explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] items-center gap-5 p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
          {/* Stars bars breakdown — derived from the real reviewList prop */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-white leading-none">{averageRating.toFixed(1)}</span>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">({totalReviews} reviews)</span>
            </div>

            {/* Stars distributions */}
            <div className="space-y-1 select-none">
              {([5, 4, 3, 2, 1] as const)
                .map((star) => {
                  const count = starDistribution[star];
                  const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  const isSelected = selectedRatingFilter === Number(star);
                  
                  return (
                    <button
                      key={star}
                      onClick={() => setSelectedRatingFilter(isSelected ? null : Number(star))}
                      className={cn(
                        "w-full flex items-center gap-2 hover:bg-slate-900/30 px-1 rounded transition-colors text-left",
                        isSelected && "bg-slate-900/50"
                      )}
                    >
                      <span className="text-[9px] text-slate-400 w-3 font-semibold text-right leading-none">{star}★</span>
                      <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 relative">
                        <div className="absolute left-0 top-0 h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono w-7 text-right leading-none">{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Positive-rating share — a real, plainly-computed metric
              (% of reviews rated 4★ or higher), not an AI sentiment claim */}
          <div className="sm:border-l sm:border-slate-800 sm:pl-5 space-y-1 h-full flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Rated 4★ or Higher</span>
            </div>

            <p className="text-xl font-black text-emerald-400 tracking-tight">
              {totalReviews > 0 ? `${positiveSharePercent}%` : '—'}
            </p>
            <p className="text-[9px] text-slate-500 leading-normal">
              {totalReviews > 0 ? `Based on ${totalReviews} review${totalReviews === 1 ? '' : 's'}` : 'No reviews yet'}
            </p>
          </div>
        </div>

        {/* Clear filter button */}
        {selectedRatingFilter && (
          <div className="flex justify-between items-center bg-indigo-950/20 border border-indigo-500/10 rounded-lg p-2 text-xs">
            <span className="text-indigo-400">Filtering reviews with {selectedRatingFilter} stars</span>
            <button
              onClick={() => setSelectedRatingFilter(null)}
              className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-white font-bold"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Review list */}
        <div className="space-y-3.5 max-h-[22rem] overflow-y-auto pr-1">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs font-semibold">
              No reviews found matching this filter.
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-800 transition-all space-y-2.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold">— {rev.user}</span>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">
                        <CheckCircle className="h-2 w-2" /> Verified
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-455 font-bold uppercase tracking-wider">{rev.time}</span>
                </div>

                {/* Response Status Badge */}
                <div className="flex items-center gap-2">
                  {rev.replied ? (
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      <CheckCircle className="h-2 w-2" /> Responded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      <AlertCircle className="h-2 w-2" /> Pending Response
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-200 italic leading-relaxed">"{rev.comment}"</p>
                
                {/* Meta details regarding product & order ID */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3 text-slate-600" />
                    Product: <span className="text-slate-300">{rev.productName}</span>
                  </span>
                  <span>•</span>
                  <span>SKU: <span className="text-slate-300">{rev.sku}</span></span>
                  <span>•</span>
                  <span>Order: <span className="text-slate-300">#{rev.orderId}</span></span>
                </div>

                {/* Inline response content */}
                {rev.replied && (
                  <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-indigo-300 leading-relaxed">
                    <span className="font-black text-[9px] uppercase tracking-wider mr-1.5 text-indigo-400">Seller Reply:</span>
                    "{rev.replyContent}"
                  </div>
                )}

                {/* Inline reply edit box toggle */}
                {replyActiveMap[rev.id] ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type response to reviewer..."
                        value={replyTextMap[rev.id] || ''}
                        onChange={(e) => setReplyTextMap((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-200 outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <Button
                        onClick={() => handleSendReply(rev.id)}
                        size="icon"
                        aria-label="Send reply"
                        className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex justify-end text-[10px] font-bold">
                      <button
                        onClick={() => handleToggleReply(rev.id)}
                        className="px-2 py-1 text-slate-400 hover:text-slate-200 uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  !rev.replied && (
                    <div className="flex gap-2.5 text-[9px] font-black uppercase tracking-wider justify-end pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleReply(rev.id)}
                        className="h-7 border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white text-[9px]"
                      >
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Reporting a review is coming soon.')}
                        className="h-7 border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white text-[9px] gap-1"
                      >
                        <Flag className="h-2.5 w-2.5" /> Report
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white text-[9px]"
                      >
                        {/* No per-order detail route exists under /seller/orders
                            yet — links to the real order list rather than a
                            fabricated deep link that would 404. */}
                        <Link href="/seller/orders">View Order</Link>
                      </Button>
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
