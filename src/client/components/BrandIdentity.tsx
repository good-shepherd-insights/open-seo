import { LOGO_ALT, LOGO_PATH, PRODUCT_NAME } from "@/shared/branding";

export function BrandIcon({ className = "size-10" }: { className?: string }) {
  return <img src={LOGO_PATH} alt={LOGO_ALT} className={className} />;
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
    >
      <BrandIcon className="size-7 shrink-0" />
      <span>{PRODUCT_NAME}</span>
    </span>
  );
}
