import type { CSSProperties } from "react";
import {
  COMPANY_NAME,
  LOGO_ALT,
  LOGO_HEIGHT_DESKTOP,
  LOGO_HEIGHT_MOBILE,
  LOGO_PATH,
} from "@/shared/branding";

export function BrandIcon({ className = "size-10" }: { className?: string }) {
  return (
    <img
      src={LOGO_PATH}
      alt={LOGO_ALT}
      className={className}
      draggable={false}
    />
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={
        {
          "--brand-mark-mobile": `${LOGO_HEIGHT_MOBILE}px`,
          "--brand-mark-desktop": `${LOGO_HEIGHT_DESKTOP}px`,
        } as CSSProperties
      }
    >
      <BrandIcon className="brand-lockup-icon shrink-0" />
      <span className="brand-wordmark-text">
        {COMPANY_NAME.split(/\s+/).map((word, index) => (
          <span className="block" key={`${word}-${index}`}>
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
