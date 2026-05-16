'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/http/services';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Seller-facing Category Request Modal
 * 
 * Allows sellers to propose new categories for the marketplace.
 * Integrated with the enterprise apiClient for request management.
 */
export function CategoryRequestModal({ onClose, onSuccess }: Props) {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/seller/categories/request', { 
        categoryName, 
        description, 
        reason 
      });
      onSuccess();
    } catch (err: any) {
      console.error('[CategoryRequest] Submit failed', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <h3 className="mb-2 text-xl font-bold tracking-tight">Request New Category</h3>
        <p className="text-sm text-muted-foreground mb-6">Propose a new category to expand the marketplace catalog.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Name</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Smart Home Essentials"
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Briefly describe the category"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason for Request</label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="Why should we add this?"
              required 
              className="rounded-xl"
            />
          </div>
          
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
              {error}
            </div>
          )}
          
          <div className="mt-6 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              disabled={loading}
              className="rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-xl px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
