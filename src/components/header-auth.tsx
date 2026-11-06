import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Button } from "./ui/button";
import { UserHeaderMenu } from "./user-header-menu";

export default function AuthButton({ user }: { user: User | null }) {
  // No user - show login/signup
  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // Anonymous users get both login and sign up buttons
  if (user.is_anonymous) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // Authenticated users get the avatar dropdown
  return <UserHeaderMenu email={user.email || ""} />;
}
