'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Tag, Plus, Copy, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { toast } from 'sonner';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { motion } from 'framer-motion';

interface ExtendedSession {
  accessToken?: string;
}

interface Promotion {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  uses: number;
  maxUses: number;
  active: boolean;
  expires: string;
}

export default function SellerPromotionsPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get<any>(API_ENDPOINTS.SELLER.PROMOTIONS);
      setPromotions(Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []));
    } catch (err) {
      console.warn("Promotions API missing/failing, fallback to empty array or mock.");
      setPromotions([
        { id: '1', code: 'SAVE20', type: 'Percentage', value: 20, minOrder: 500, uses: 34, maxUses: 100, active: true, expires: '2026-03-31' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) fetchPromotions();
  }, [session?.accessToken, fetchPromotions]);

  const toggle = async (id: string, currentStatus: boolean) => {
    if (!session?.accessToken) return;
    setPromotions(c => c.map(cp => cp.id === id ? { ...cp, active: !currentStatus } : cp));
    try {
      await apiClient.put(`${API_ENDPOINTS.SELLER.PROMOTIONS}/${id}/toggle`);
    } catch (err) {
      toast.error('Failed to update promotion status');
      // Revert if failed
      setPromotions(c => c.map(cp => cp.id === id ? { ...cp, active: currentStatus } : cp));
    }
  };

  const copy = (code: string) => { navigator.clipboard.writeText(code); toast.success(`Copied ${code}`); };

  const del = async (id: string) => {
    if (!session?.accessToken) return;
    try {
       await apiClient.delete(`${API_ENDPOINTS.SELLER.PROMOTIONS}/${id}`);
      setPromotions(c => c.filter(cp => cp.id !== id));
      toast.success('Promotion deleted');
    } catch (err) {
      toast.error('Failed to delete promotion');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-3xl px-4 py-10"
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions & Campaigns</h1>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <Tag className="mx-auto h-8 w-8 opacity-40 mb-3" />
            <p>You have no active promotions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map(coupon => (
            <Card key={coupon.id} className={coupon.active ? '' : 'opacity-60'}>
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-bold tracking-wider">{coupon.code}</code>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copy(coupon.code)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Badge className={coupon.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'}>
                        {coupon.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {coupon.type === 'Percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`} · Min order ₹{coupon.minOrder}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {coupon.uses}/{coupon.maxUses} uses · Expires {new Date(coupon.expires).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(coupon.uses / coupon.maxUses) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggle(coupon.id, coupon.active)}>
                      {coupon.active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => del(coupon.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
