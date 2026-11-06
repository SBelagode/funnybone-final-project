import * as React from "react";

import { cn } from "@/lib/utils";

type BrandImageVariant = "logo" | "mark" | "mark-icon";

interface BrandImageProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BrandImageVariant;
  alt?: string;
  decorative?: boolean;
}

export function BrandImage({
  variant,
  alt = "Crackd",
  decorative = false,
  className,
  ...props
}: BrandImageProps) {
  return (
    <span
      data-brand-variant={variant}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? "true" : undefined}
      className={cn("brand-image", className)}
      {...props}
    />
  );
}
