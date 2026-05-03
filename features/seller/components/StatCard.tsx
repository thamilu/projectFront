import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  iconColorClass?: string;
  valueColorClass?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-blue-600',
  valueColorClass = '',
}: StatCardProps) {
  return (
    <Card className="border-2 transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">{title}</span>
          <Icon className={`h-4 w-4 ${iconColorClass}`} />
        </div>
        <div className={`text-3xl font-bold ${valueColorClass}`}>{value}</div>
        <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
