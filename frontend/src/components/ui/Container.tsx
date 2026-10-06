import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 md:px-10 xl:px-20",
        size === "default" ? "max-w-content" : "max-w-wide",
        className,
      )}
    >
      {children}
    </div>
  );
}
