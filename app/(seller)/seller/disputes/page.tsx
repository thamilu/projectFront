'use client';

import { AlertTriangle, Clock, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';

const STATUS_CONFIG = {
  Open: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: Clock },
  'In Review': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: AlertTriangle },
  Resolved: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  Closed: { color: 'bg-muted text-muted-foreground', icon: XCircle },
} as const;

const DISPUTES = [
  { id: 'DSP-001', orderId: 'ORD-8821', customer: 'Priya S.', product: 'Wireless Earbuds Pro', reason: 'Item not received', status: 'Open' as const, date: '2026-02-23', amount: 2499 },
  { id: 'DSP-002', orderId: 'ORD-8710', customer: 'Rahul M.', product: 'Cotton Kurta Set', reason: 'Wrong item sent', status: 'In Review' as const, date: '2026-02-18', amount: 749 },
  { id: 'DSP-003', orderId: 'ORD-7990', customer: 'Arjun P.', product: 'Leather Wallet', reason: 'Defective product', status: 'Resolved' as const, date: '2026-02-10', amount: 299 },
];

export default function SellerDisputesPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Order Disputes</h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {(['Open', 'In Review', 'Resolved'] as const).map(s => {
          const count = DISPUTES.filter(d => d.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <Card key={s}>
              <CardContent className="pt-5 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <Badge className={`mt-1 text-xs ${cfg.color}`}>{s}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        {DISPUTES.map(d => {
          const cfg = STATUS_CONFIG[d.status];
          const Icon = cfg.icon;
          return (
            <Card key={d.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-semibold">{d.id}</p>
                      <Badge className={`text-xs ${cfg.color} gap-1`}>
                        <Icon className="h-3 w-3" /> {d.status}
                      </Badge>
                    </div>
                    <p className="text-sm"><span className="text-muted-foreground">Order:</span> {d.orderId} · {d.product}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Customer:</span> {d.customer}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {d.reason}</p>
                    <p className="text-xs text-muted-foreground">Opened: {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">₹{d.amount.toLocaleString('en-IN')}</p>
                    <Button size="sm" variant="outline" className="mt-2 gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Respond
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
