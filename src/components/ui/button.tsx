import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      style={variant === "primary" ? { backgroundColor: "var(--primary)" } : undefined}
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        {
          primary: "text-white hover:opacity-90 active:scale-[0.98]",
          secondary: "bg-muted text-foreground hover:bg-neutral-200 active:scale-[0.98]",
          ghost: "hover:bg-muted active:bg-neutral-200",
          outline: "border border-border bg-transparent hover:bg-muted active:bg-neutral-200",
        }[variant],
        {
          sm: "h-8 px-4 text-xs",
          md: "h-10 px-6 text-sm",
          lg: "h-12 px-8 text-base",
          icon: "h-10 w-10 p-0",
        }[size],
        className
      )}
      {...props}
    />
  );
}
