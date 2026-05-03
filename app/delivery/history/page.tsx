'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { History, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CompletedDelivery {
  id: number;
  orderNumber: string;
  address: string;
  customerName: string;
  totalAmount: number;
  deliveredAt: string;
  status: string;
}

export default function DeliveryHistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<CompletedDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch('/api/v1/delivery/history', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setHistory(d?.data?.content ?? d?.content ?? d?.data ?? []))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <History className="h-7 w-7 text-primary" />
          Delivery History
        </h1>
        <p className="mt-1 text-muted-foreground">Your completed and past deliveries.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No history yet</h2>
            <p className="text-sm text-muted-foreground">Completed deliveries will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="font-semibold">Order #{d.orderNumber}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {d.address}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />{' '}
                    {d.deliveredAt ? format(new Date(d.deliveredAt), 'dd MMM yyyy, HH:mm') : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={d.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {d.status}
                  </Badge>
                  <span className="text-sm font-medium">₹{d.totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
