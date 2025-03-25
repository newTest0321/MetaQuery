import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-md hover:scale-[1.02] hover:shadow-lg",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-gray-300 bg-transparent text-gray-900 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
        secondary:
          "bg-gray-700 text-white hover:bg-gray-600 shadow-md",
        ghost:
          "hover:bg-gray-100 text-gray-900 dark:text-white dark:hover:bg-gray-800",
        link: "text-blue-500 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-sm",
        lg: "h-12 px-6 text-lg",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
