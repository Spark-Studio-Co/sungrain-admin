import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, Inbox, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type CrmStateVariant = "empty" | "error" | "loading"

type CrmStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
  variant?: CrmStateVariant
}

const variantStyles: Record<
  CrmStateVariant,
  {
    icon: string
    surface: string
  }
> = {
  empty: {
    icon: "border-[#dbe8dc] bg-[#eef5ef] text-[#2f6b4f]",
    surface: "",
  },
  error: {
    icon: "border-[#f2c7c1] bg-[#fff0ee] text-destructive",
    surface: "border-[#f2c7c1] bg-[#fff8f7]",
  },
  loading: {
    icon: "border-[#ffd7a8] bg-[#fff3e3] text-[#d6730c]",
    surface: "",
  },
}

function CrmState({
  title,
  description,
  icon,
  action,
  className,
  variant = "empty",
}: CrmStateProps) {
  const Icon =
    icon ?? (variant === "error" ? AlertTriangle : variant === "loading" ? Loader2 : Inbox)

  return (
    <div className={cn("crm-state-surface", variantStyles[variant].surface, className)}>
      <div className="flex max-w-md flex-col items-center text-center">
        <div
          className={cn(
            "mb-3 grid size-11 place-items-center rounded-md border shadow-[0_8px_18px_rgba(34,49,55,0.06)]",
            variantStyles[variant].icon
          )}
        >
          <Icon className={cn("size-5", variant === "loading" && "animate-spin")} />
        </div>
        <div className="text-base font-bold text-[#223137]">{title}</div>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-[#6f7774]">{description}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  )
}

function CrmEmptyState(props: Omit<CrmStateProps, "variant">) {
  return <CrmState variant="empty" {...props} />
}

function CrmErrorState(props: Omit<CrmStateProps, "variant">) {
  return <CrmState variant="error" {...props} />
}

function CrmLoadingState(props: Omit<CrmStateProps, "variant">) {
  return <CrmState variant="loading" {...props} />
}

export { CrmEmptyState, CrmErrorState, CrmLoadingState, CrmState }
