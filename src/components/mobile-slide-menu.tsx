"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu, Sparkles, TrendingUp, Heart, Image as ImageIcon } from "lucide-react";
import { UserHeaderMenu } from "./user-header-menu";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileSlideMenuProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export default function MobileSlideMenu({
  email,
  firstName,
  lastName,
}: MobileSlideMenuProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isTop100Route = pathname === "/" || pathname?.startsWith("/top-100");

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const formatName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    return "User";
  };

  const navItems = [
    {
      label: "New",
      href: "/new",
      icon: Sparkles,
    },
    {
      label: "Top 100",
      href: "/",
      icon: TrendingUp,
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: Heart,
    },
  ];

  const accountItems = [
    {
      label: "Images",
      href: "/my-images",
      icon: ImageIcon,
    },
  ];

  return (
    <div className="sm:hidden flex items-center">
      <button
        onClick={toggleMenu}
        className="p-2 hover:bg-accent rounded-lg transition-colors z-50"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={closeMenu}
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-[#1a1a1a] border-l 
                          border-gray-800/50 z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-end p-6 border-b border-gray-800/50">
                <button
                  onClick={closeMenu}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? isTop100Route
                      : pathname === item.href || pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-all",
                        "hover:bg-white/5",
                        isActive
                          ? "bg-white/5"
                          : ""
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <div className="flex-1">
                        <div
                          className={cn(
                            "text-base font-medium",
                            isActive ? "text-primary" : "text-white"
                          )}
                        >
                          {item.label}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* Account Items */}
                <div className="space-y-2">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? isTop100Route
                        : pathname === item.href || pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg transition-all",
                          "hover:bg-white/5",
                          isActive ? "bg-white/5" : ""
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-6 h-6 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <div
                          className={cn(
                            "text-base font-medium",
                            isActive ? "text-primary" : "text-white"
                          )}
                        >
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* User Profile Footer */}
              <div className="border-t border-gray-800/50 bg-[#1a1a1a]">
                <div className="flex items-center gap-4 p-4">
                  <UserHeaderMenu
                    email={email}
                    firstName={firstName}
                    lastName={lastName}
                    showOnMobile
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {formatName()}
                    </div>
                    <div className="text-xs py-1 text-gray-500 truncate">{email}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
