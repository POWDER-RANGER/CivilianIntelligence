import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium uppercase tracking-[0.06em]",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-muted-foreground",
        steel: "border-transparent bg-muted text-steel",
        live: "border-transparent bg-success-subtle text-success",
        warn: "border-transparent bg-warn-subtle text-warn",
        danger: "border-transparent bg-danger-subtle text-danger",
        outline: "border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
