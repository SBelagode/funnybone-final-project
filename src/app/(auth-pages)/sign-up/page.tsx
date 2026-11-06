import Link from "next/link";
import { FormMessage, type Message } from "@/components/form-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthForm from "@/components/auth-form";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Fetch approved domains
  const { data: domains } = await supabase
    .from("allowed_signup_domains")
    .select("apex_domain")
    .order("apex_domain");

  if ("success" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-md">
          <FormMessage message={searchParams} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm sm:max-w-md 
                    md:max-w-lg lg:max-w-xl mx-auto px-4 mt-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create an account to get started</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <div className="space-y-4 w-full">
            <AuthForm variant="signup" />

            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex  -mt-3 justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground pb-4">
              <Link
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                href="/sign-up/email"
              >
                <span>Continue with email</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="text-primary hover:underline" href="/login">
                Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground w-full border-l-4
                      border-muted pl-4 py-2 bg-muted/5 rounded-r">
        <p className="font-medium mb-2">
          We&apos;re currently only accepting sign-ups from the following
          domains:
        </p>
        <ul className="list-disc list-inside space-y-1">
          {domains?.map((domain) => (
            <li key={domain.apex_domain}>{domain.apex_domain}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
