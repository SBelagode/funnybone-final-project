import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { FormMessage, type Message } from "@/components/form-message";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";

export default async function SignupEmail(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  // Display success message if present
  if ("success" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen
                      lg:max-w-xl justify-center gap-4 p-20">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 w-full max-w-sm sm:max-w-md 
                    md:max-w-lg lg:max-w-xl mx-auto px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Sign up with Email</CardTitle>
          <CardDescription>
            Enter your email and password to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <div className="space-y-4 w-full">
            {/* Email Sign Up Form */}
            <form className="flex flex-col gap-6 w-full">
              <div className="grid gap-2 w-full">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  placeholder="you@example.com"
                  required
                  className="w-full"
                />
              </div>
              <div className="grid gap-2 w-full">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  name="password"
                  placeholder="Your password"
                  minLength={6}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" name="terms" required />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link
                      href="/terms-of-service"
                      className="text-primary hover:underline"
                    >
                      Terms and Conditions
                    </Link>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="privacy" name="privacy" required />
                  <Label htmlFor="privacy" className="text-sm">
                    I agree to the{" "}
                    <Link
                      href="/privacy-policy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>
              <SubmitButton
                formAction={signUpAction}
                pendingText="Signing up..."
              >
                Sign up
              </SubmitButton>
              <FormMessage message={searchParams} />
            </form>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="text-primary hover:underline" href="/login">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
