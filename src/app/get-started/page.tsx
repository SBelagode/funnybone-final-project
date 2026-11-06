import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { BrandImage } from "@/components/brand-image";

export default async function GetStarted() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to the home page
  if (user) {
    return redirect("/");
  }

  return (
    <main className="flex items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <div className="flex justify-center -mb-16">
          <BrandImage variant="logo" alt="Logo" className="w-[250px] h-[250px]" />
        </div>
        <p className="text-muted-foreground -pt-6">
          Choose how you&apos;d like to begin your journey with us
        </p>

        <div className="space-y-4">
          <Link href="/login" className="block">
            <HoverBorderGradient
              containerClassName="rounded-full w-full"
              as="button"
              className="bg-background text-foreground flex items-center justify-center
                         space-x-2 w-full"
            >
              <span className="text-md ps-5 pe-5">I have an account</span>
            </HoverBorderGradient>
          </Link>

          <Link href="/sign-up" className="block">
            <HoverBorderGradient
              containerClassName="rounded-full w-full"
              as="button"
              className="bg-primary text-primary-foreground flex items-center justify-center
                         space-x-2 w-full"
            >
              <span className="text-md ps-5 pe-5">Create an account</span>
            </HoverBorderGradient>
          </Link>
        </div>
      </div>
    </main>
  );
}
