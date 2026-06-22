import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-[linear-gradient(90deg,rgba(77,124,93,0.08),rgba(243,136,16,0.12),rgba(77,124,93,0.08))]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
