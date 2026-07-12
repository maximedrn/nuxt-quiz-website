import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/app/lib/cn.ts";

const badgeVariants: ReturnType<typeof cva> = cva(
  cn(
    "h-5",
    "gap-1",
    "rounded-4xl",
    "border",
    "border-transparent",
    "px-2",
    "py-0.5",
    "text-xs",
    "font-medium",
    "transition-all",
    "has-data-[icon=inline-end]:pr-1.5",
    "has-data-[icon=inline-start]:pl-1.5",
    "[&>svg]:size-3!",
    "group/badge",
    "inline-flex",
    "w-fit",
    "shrink-0",
    "items-center",
    "justify-center",
    "overflow-hidden",
    "whitespace-nowrap",
    "focus-visible:border-ring",
    "focus-visible:ring-3",
    "focus-visible:ring-ring/50",
    "aria-invalid:border-destructive",
    "aria-invalid:ring-destructive/20",
    "dark:aria-invalid:ring-destructive/40",
    "[&>svg]:pointer-events-none",
  ),
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: cn(
          "bg-primary",
          "text-primary-foreground",
          "[a]:hover:bg-primary/80",
        ),
        destructive: cn(
          "bg-destructive/10",
          "[a]:hover:bg-destructive/20",
          "focus-visible:ring-destructive/20",
          "dark:focus-visible:ring-destructive/40",
          "text-destructive",
          "dark:bg-destructive/20",
        ),
        ghost: cn(
          "hover:bg-muted",
          "hover:text-muted-foreground",
          "dark:hover:bg-muted/50",
        ),
        link: cn("text-primary", "underline-offset-4", "hover:underline"),
        outline: cn(
          "border-border",
          "text-foreground",
          "[a]:hover:bg-muted",
          "[a]:hover:text-muted-foreground",
        ),
        secondary: cn(
          "bg-secondary",
          "text-secondary-foreground",
          "[a]:hover:bg-secondary/80",
        ),
      },
    },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

export type { BadgeVariants };
export { badgeVariants };
