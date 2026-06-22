import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold tracking-normal transition-[background-color,color,border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border-[#ffd7a8] bg-[#fff3e3] text-[#d6730c] [a&]:hover:bg-[#ffe8ca]",
        secondary:
          "border-[#dbe8dc] bg-secondary text-secondary-foreground [a&]:hover:bg-[#e4f0e5]",
        destructive:
          "border-[#f2c7c1] bg-[#fff0ee] text-destructive [a&]:hover:bg-[#ffe4e0] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        success:
          "border-[#cfe2d2] bg-[#eef5ef] text-[#2f6b4f] [a&]:hover:bg-[#e4f0e5]",
        info:
          "border-[#cfe2e8] bg-[#edf5f7] text-[#517b8f] [a&]:hover:bg-[#e4f0f4]",
        solid:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        outline:
          "border-[#dfe7de] bg-white text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
