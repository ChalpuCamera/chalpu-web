import * as React from "react";
import { cn } from "@/lib/utils";

export type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        {...props}
      >
        {children}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export type RadioGroupItemProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    value: string;
  };

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        value={value}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-gray-300 text-blue-600 shadow focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
