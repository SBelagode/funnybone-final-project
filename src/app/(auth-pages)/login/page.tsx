import Link from "next/link";
import AuthForm from "@/components/auth-form";
import { FormMessage, type Message } from "@/components/form-message";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default async function Signin(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const hasFeedback =
    "message" in searchParams ||
    "error" in searchParams ||
    "success" in searchParams;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pt-16">
      <Card className="w-full border-none shadow-none">
        <CardHeader className="space-y-0">
          <CardTitle className="text-2xl text-center pb-2">
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasFeedback && (
            <div className="flex justify-center">
              <FormMessage message={searchParams} />
            </div>
          )}
          {/* Login Options Group */}
          <div className="space-y-4">
            <AuthForm />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <Link
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                href="/login-with-email"
              >
                <span>Continue with Email</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Sign Up Section */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            Don&#39;t have an account?{" "}
            <Link className="text-primary hover:underline" href="/sign-up">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
