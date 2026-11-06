// Each app needs a separate session, including when localhost ports share cookies.
export const getSupabaseAuthCookieOptions = (supabaseUrl: string) => {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  return { name: `sb-${projectRef}-funnybone-auth-token` };
};
