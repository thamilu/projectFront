'use client';

import { useState } from 'react';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Flame, Tag } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { toast } from 'sonner';

const PROMOTIONS = [
  { id: '1', title: 'Flash Sale — Electronics', type: 'Flash Deal', discount: '40% off', products: 8, status: 'Active', starts: '2026-02-25', ends: '2026-02-26' },
  { id: '2', title: 'Weekend Fashion Fest', type: 'Discount', discount: '30% off', products: 15, status: 'Active', starts: '2026-02-22', ends: '2026-02-24' },
  { id: '3', title: 'New Year Clearance', type: 'Flash Deal', discount: '50% off', products: 22, status: 'Ended', starts: '2026-01-01', ends: '2026-01-05' },
];

export default function SellerCouponsPage() {
  const [promos, setPromos] = useState(PROMOTIONS);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Promotion</Button>
      </div>

      <div className="space-y-3">
        {promos.map(promo => (
          <Card key={promo.id} className={promo.status === 'Ended' ? 'opacity-60' : ''}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    {promo.type === 'Flash Deal'
                      ? <Flame className="h-4 w-4 text-red-500" />
                      : <Tag className="h-4 w-4 text-orange-500" />}
                    <p className="font-semibold">{promo.title}</p>
                    <Badge className={promo.status === 'Active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs'
                      : 'bg-muted text-muted-foreground text-xs'}>
                      {promo.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{promo.type} · {promo.discount} · {promo.products} products</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(promo.starts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
                    {new Date(promo.ends).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                    onClick={() => { setPromos(p => p.filter(pr => pr.id !== promo.id)); toast.success('Promotion deleted'); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
