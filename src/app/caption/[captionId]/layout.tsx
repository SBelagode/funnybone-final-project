import type { Metadata } from "next";
import { fetchCaptionByIdAction } from "@/app/actions/captions";

export async function generateMetadata(
  { params }: { params: Promise<{ captionId: string }> }
): Promise<Metadata> {
  const { captionId } = await params;

  const cap = await fetchCaptionByIdAction(captionId);

  const appEnvironment = (process.env.NEXT_PUBLIC_ENVIRONMENT || "local").toLowerCase();
  const isProduction = appEnvironment === "production";
  const fallbackLogo = isProduction ? "/logo-dark.svg" : "/logo-dark-nonprod.svg";
  const site = process.env.NEXT_PUBLIC_BASE_URL || "https://crackd.ai";
  const raw = cap?.image_url || fallbackLogo;
  const img = raw.startsWith("http") ? raw : new URL(raw, site).toString();
  const title = cap?.content?.slice(0, 70) || "Crackd.ai";

  return {
    title,
    openGraph: {
      title,
      url: `${site}/caption/${captionId}`,
      type: "article",
      images: [{ url: img, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [img],
    },
  };
}

export default function CaptionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
