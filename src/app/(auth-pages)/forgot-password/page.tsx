'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const searchParams = useSearchParams();
  const message = searchParams.get("success") || searchParams.get("error");
  const isSuccess = Boolean(searchParams.get("success"));

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full -mt-20 m-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSuccess ? "Email Sent" : "Reset Password"}
          </CardTitle>
          {!isSuccess && (
            <CardDescription>
              Enter your email below to reset your password
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {decodeURIComponent(message ?? "")}
              </p>
              <form>
                <Button asChild className="w-full">
                  <Link href="/login">Back to Log In</Link>
                </Button>
              </form>
            </div>
          ) : (
            <form className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input name="email" placeholder="you@example.com" required />
              </div>
              <SubmitButton
                formAction={forgotPasswordAction}
                pendingText="Resetting..."
              >
                Reset Password
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
