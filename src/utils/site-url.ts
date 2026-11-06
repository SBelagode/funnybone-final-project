export const getSiteBaseUrl = () => {
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

export const buildCaptionShareUrl = (captionId: string) => {
  const baseUrl = getSiteBaseUrl();
  if (!baseUrl) {
    return `/caption/${captionId}`;
  }
  return `${baseUrl}/caption/${captionId}`;
};
