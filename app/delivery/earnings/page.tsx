'use client';

import { IndianRupee, TrendingUp, Package, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { label: 'Total Earned', value: '₹18,450', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
  { label: 'This Week', value: '₹2,200', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' },
  { label: 'Deliveries', value: '142', icon: Package, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
  { label: 'Pending', value: '₹840', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' },
];

const HISTORY = [
  { date: '2026-02-25', deliveries: 8, amount: 640, bonus: 100 },
  { date: '2026-02-24', deliveries: 10, amount: 800, bonus: 0 },
  { date: '2026-02-23', deliveries: 7, amount: 560, bonus: 50 },
  { date: '2026-02-22', deliveries: 12, amount: 960, bonus: 200 },
  { date: '2026-02-21', deliveries: 6, amount: 480, bonus: 0 },
];

export default function DeliveryEarningsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Earnings</h1>

      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {STATS.map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-center font-semibold">Deliveries</th>
              <th className="px-4 py-3 text-right font-semibold">Earnings</th>
              <th className="px-4 py-3 text-right font-semibold">Bonus</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map(h => (
              <tr key={h.date} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td className="px-4 py-3 text-center">{h.deliveries}</td>
                <td className="px-4 py-3 text-right">₹{h.amount}</td>
                <td className="px-4 py-3 text-right">
                  {h.bonus > 0 ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">+₹{h.bonus}</Badge> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-semibold">₹{h.amount + h.bonus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
