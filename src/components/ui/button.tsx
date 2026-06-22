import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-normal outline-none transition-[background-color,color,border-color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,var(--crm-orange-500),var(--crm-orange-600))] text-primary-foreground shadow-[0_10px_22px_rgba(243,136,16,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(243,136,16,0.28)]",
        destructive:
          "bg-destructive text-white shadow-[0_10px_22px_rgba(194,65,53,0.18)] hover:-translate-y-0.5 hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-white text-foreground shadow-[0_8px_18px_rgba(34,49,55,0.055)] hover:-translate-y-0.5 hover:border-[#cbd8c9] hover:bg-[#f8faf7] hover:text-[#2f6b4f]",
        secondary:
          "border border-[#dbe8dc] bg-secondary text-secondary-foreground shadow-[0_8px_18px_rgba(47,107,79,0.08)] hover:-translate-y-0.5 hover:bg-[#e4f0e5]",
        success:
          "bg-[linear-gradient(135deg,var(--crm-green-600),var(--crm-green-700))] text-white shadow-[0_10px_22px_rgba(47,107,79,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(47,107,79,0.26)]",
        subtle:
          "border border-transparent bg-[#f6f8f5] text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]",
        ghost: "text-[#53605a] hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 px-6 text-base has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
