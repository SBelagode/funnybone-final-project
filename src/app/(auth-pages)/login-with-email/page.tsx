import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { FormMessage, type Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export default async function LoginWithEmail(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen
                      sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] 
         w-full px-4 py-4 -mt-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Login with Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                name="password"
                placeholder="Your password"
                required
              />
              <Link
                className="text-xs text-foreground underline underline-offset-4"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <SubmitButton formAction={signInAction} pendingText="Logging in...">
              Login
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>

          <div className="mt-4 text-center text-sm">
            Don&#39;t have an account?{" "}
            <Link className="underline underline-offset-4" href="/sign-up">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
