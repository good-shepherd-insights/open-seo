import logoUrl from "@/public/images/logo.svg";

export function Logo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: 24, md: 40, lg: 64 };
  const alt = "Maryland Insights";
  const height = sizes[size] || 40;

  return (
    <a href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="Maryland Insights home">
      {
        logoUrl && (
          <img
            src={logoUrl}
            alt={alt}
            width={height}
            height={height}
            className="shrink-0"
            draggable={false}
          />
        )
      }
    </a>
  );
}
