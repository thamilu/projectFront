import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface FieldHelpProps {
  children: React.ReactNode
  tooltip?: string
}

/**
 * Field help component - shows helpful hints below form fields
 */
export function FieldHelp({ children, tooltip }: FieldHelpProps) {
  return (
    <div className="flex items-start gap-1 mt-1">
      <p className="text-xs text-muted-foreground">{children}</p>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help mt-0.5" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
