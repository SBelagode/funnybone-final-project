"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipArrow,
} from "@/components/ui/tooltip";

const containerClasses = [
  "inline-flex items-center gap-1",
  "rounded-full border px-1 py-0.5",
  "bg-background shadow-sm"
].join(" ");

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!mounted) return null;

  // Determine effective theme (light or dark)
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const isDark = effectiveTheme === "dark";

  const options = [
    { value: "light", icon: <Sun size={16} />, label: "Light Mode" },
    { value: "dark", icon: <Moon size={16} />, label: "Dark Mode" },
    { value: "system", icon: <Monitor size={16} />, label: "System" },
  ];

  return (
    <TooltipProvider>
      <div className={containerClasses}>
        {options.map(({ label, value, icon }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(value)}
                className={`
                  p-1.5 rounded-full transition-all
                  ${theme === value
                    ? "bg-muted text-primary"
                    : "hover:bg-accent text-muted-foreground"}
                `}
                aria-label={label}
              >
                {icon}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className={`
                ${isDark ? "bg-white text-black" : "bg-black text-white"}
                border-none
              `}
            >
              <span>{label}</span>
              <TooltipArrow
                className={isDark ? "fill-white" : "fill-black"}
              />
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
