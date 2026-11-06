"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AccountDeletedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Account Deleted</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Your account has been deleted. We&apos;re sorry to see you go.
          </p>
        </div>
        <Button onClick={() => router.push("/")} className="w-full">
          Return to Home Page
        </Button>
      </div>
    </div>
  );
}
