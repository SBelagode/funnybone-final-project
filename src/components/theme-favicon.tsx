"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

function getEnvironmentTag() {
  if (typeof document === "undefined") {
    return "prod";
  }

  return document.documentElement.dataset.env === "nonprod" ? "nonprod" : "prod";
}

export function ThemeFavicon() {
  const { theme, systemTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const effectiveTheme =
      resolvedTheme ?? (theme === "system" ? systemTheme : theme) ?? "dark";
    const isDark = effectiveTheme === "dark";
    const envTag = getEnvironmentTag();
    const iconPath =
      envTag === "nonprod"
        ? isDark
          ? "/favicon-nonprod.svg"
          : "/favicon-light-nonprod.svg"
        : isDark
        ? "/favicon-dark.svg"
        : "/favicon-light.svg";

    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][data-theme-favicon="true"]'
    );

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.setAttribute("data-theme-favicon", "true");
      document.head.appendChild(link);
    }

    link.href = iconPath;
  }, [resolvedTheme, systemTheme, theme]);

  return null;
}
