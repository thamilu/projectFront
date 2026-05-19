import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/shared/utils"

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string
}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, message, ...props }, ref) => {
    if (!message) return null

    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-destructive animate-in fade-in slide-in-from-top-1">
        <AlertCircle className="h-3.5 w-3.5" />
        <p
          ref={ref}
          className={cn("text-xs font-medium", className)}
          {...props}
        >
          {message}
        </p>
      </div>
    )
  }
)
FormError.displayName = "FormError"

export { FormError }
