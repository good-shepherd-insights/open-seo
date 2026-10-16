import type { CSSProperties } from "react";
import {
  COMPANY_NAME,
  LOGO_ALT,
  LOGO_HEIGHT_DESKTOP,
  LOGO_HEIGHT_MOBILE,
  LOGO_PATH,
  LOGO_SCALE,
} from "@/shared/branding";

const markStyle = {
  "--brand-mark-mobile": `${LOGO_HEIGHT_MOBILE * LOGO_SCALE}px`,
  "--brand-mark-desktop": `${LOGO_HEIGHT_DESKTOP * LOGO_SCALE}px`,
} as CSSProperties;

export function BrandIcon({
  className = "brand-standalone-icon",
}: {
  className?: string;
}) {
  return (
    <img
      src={LOGO_PATH}
      alt={LOGO_ALT}
      className={className}
      style={markStyle}
      draggable={false}
    />
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`brand-wordmark inline-flex items-center ${className}`}
      style={{ "--brand-logo-scale": LOGO_SCALE } as CSSProperties}
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
