import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  // Legacy props for backward compatibility
  label?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  label
}: StatsCardProps) {
  // Support legacy label prop
  const displayTitle = title || label;
  
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm p-6",
      className
    )}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{displayTitle}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center text-xs">
            <span className={cn(
              "font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">
              from last month
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
