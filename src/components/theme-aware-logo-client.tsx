"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandImage } from "@/components/brand-image";

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Crackd.ai";

interface ThemeAwareLogoClientProps {
  isAuthenticated: boolean;
}

export function ThemeAwareLogoClient({ isAuthenticated }: ThemeAwareLogoClientProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const isNewActive = pathname === "/new";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    const id = requestAnimationFrame(() => {
      setMounted(true);
      checkMobile();
    });

    window.addEventListener("resize", checkMobile);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const logoVariant = isMobile ? "mark" : "logo";

  const logoHref = "/";

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div
        className="relative w-[50px] h-[50px] sm:w-[85px] sm:h-[90px] 
                    md:w-[105px] md:h-[105px] lg:w-[125px] lg:h-[125px]"
      >
        <Link href={logoHref} className="block w-full h-full">
          <BrandImage
            variant={logoVariant}
            alt={brandName}
            className="w-full h-full"
          />
        </Link>
      </div>
      {/* "New" - Primary action, grouped with logo */}
      {isAuthenticated && (
        <Link
          href="/new"
          className={cn(
            "hidden sm:block text-base font-medium transition-colors hover:text-primary",
            isNewActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          New
        </Link>
      )}
    </div>
  );
}
