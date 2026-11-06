"use client";

import { signOutAction } from "@/app/actions/auth";
import Link from "next/link";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { fetchUserProfileAction } from "@/app/actions/profile";
import MobileSlideMenu from "./mobile-slide-menu";
import { cn } from "@/lib/utils";

interface UserHeaderMenuProps {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  showOnMobile?: boolean;
}

export function UserHeaderMenu({ email, showOnMobile }: UserHeaderMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));

    // Try to fetch user's name
    const fetchUserName = async () => {
      try {
        const profile = await fetchUserProfileAction();
        if (profile) {
          if (profile.first_name) {
            setFirstName(profile.first_name);
          }
          if (profile.last_name) {
            setLastName(profile.last_name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserName();
    return () => cancelAnimationFrame(id);
  }, []);

  // Format the full name
  const fullName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return "User";
    }
  };

  return (
    <>
      <div className={showOnMobile ? "block sm:hidden" : "hidden sm:block"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "cursor-pointer p-2 hover:bg-accent rounded-full transition-colors",
                showOnMobile ? "" : "ml-[-25px]"
              )}
            >
              <User className="h-6 w-6 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName()}</p>
                <p className="text-xs leading-none text-muted-foreground">{email}</p>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile" className="w-full cursor-pointer">
                Profile
              </Link>
            </DropdownMenuItem>

            {mounted && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="light" className="cursor-pointer">
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="cursor-pointer">
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            <DropdownMenuItem asChild className="cursor-pointer">
              <form action={signOutAction} className="w-full cursor-pointer">
                <button type="submit" className="w-full cursor-pointer text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!showOnMobile && (
        <MobileSlideMenu email={email} firstName={firstName} lastName={lastName} />
      )}
    </>
  );
}
