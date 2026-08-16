'use client';

import React, { useState } from 'react';
import { Star, AlertCircle, CheckCircle, Info, Send, Flag, ShoppingBag } from 'lucide-react';
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

  const starDistribution = {
    5: 180,
    4: 26,
    3: 5,
    2: 1,
    1: 0
  };

  const totalReviews = Object.values(starDistribution).reduce((a, b) => a + b, 0);

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
    <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header Title */}
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-white">Recent Customer Reviews</h3>
          <p className="text-xs text-slate-400">Manage customer feedback, ratings, and replies</p>
        </div>

        {/* Rating Breakdown & Sentiment score explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] items-center gap-5 p-4 bg-slate-950/40 border border-slate-850/80 rounded-xl">
          {/* Stars bars breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-white leading-none">4.8</span>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">({totalReviews} reviews)</span>
            </div>
            
            {/* Stars distributions */}
            <div className="space-y-1 select-none">
              {(Object.keys(starDistribution) as unknown as Array<keyof typeof starDistribution>)
                .reverse()
                .map((star) => {
                  const count = starDistribution[star];
                  const percentage = Math.round((count / totalReviews) * 100);
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
                      <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden border border-slate-850/60 relative">
                        <div className="absolute left-0 top-0 h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono w-7 text-right leading-none">{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Sentiment Summary */}
          <div className="sm:border-l sm:border-slate-800 sm:pl-5 space-y-1 h-full flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              <span>Sentiment Score</span>
              <div className="group/tip relative cursor-pointer">
                <Info className="h-3.5 w-3.5 text-slate-500 hover:text-white" />
                <div className="absolute bottom-5 right-1/2 translate-x-1/2 w-48 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-medium leading-relaxed text-slate-350 shadow-2xl pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity z-30">
                  Sentiment score is calculated by AI analyzing positive keywords and emotional metrics in the last 50 customer feedback listings.
                </div>
              </div>
            </div>
            
            <p className="text-xl font-black text-emerald-400 tracking-tight">94% Positive</p>
            <p className="text-[9px] text-slate-500 leading-normal">Based on 50 reviews • Last 30 days</p>
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
              <div key={rev.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-all space-y-2.5">
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
                    Product: <span className="text-slate-350">{rev.productName}</span>
                  </span>
                  <span>•</span>
                  <span>SKU: <span className="text-slate-350">{rev.sku}</span></span>
                  <span>•</span>
                  <span>Order: <span className="text-slate-350">#{rev.orderId}</span></span>
                  <span>•</span>
                  <span className="text-slate-400">👍 {Math.floor(Math.random() * 20) + 3} found helpful</span>
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
                  <div className="space-y-2 pt-2 border-t border-slate-850/80">
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
                        className="h-8 w-8 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex justify-end text-[10px] font-bold">
                      <button
                        onClick={() => handleToggleReply(rev.id)}
                        className="px-2 py-1 text-slate-450 hover:text-slate-200 uppercase tracking-widest"
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
                        className="h-7 border-slate-800 bg-slate-950/40 text-slate-350 hover:text-white text-[9px]"
                      >
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-slate-800 bg-slate-950/40 text-slate-350 hover:text-white text-[9px] gap-1"
                      >
                        <Flag className="h-2.5 w-2.5" /> Report
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-slate-800 bg-slate-950/40 text-slate-350 hover:text-white text-[9px]"
                      >
                        View Order
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
