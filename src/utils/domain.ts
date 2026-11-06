import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { parse } from "tldts";

import type { Database } from "@/types/supabase";

/**
 * Returns the registrable apex domain for a given email or domain string.
 * Uses the public suffix list to correctly handle multi-level TLDs.
 */
export const getApexDomain = (input: string | null | undefined) => {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const candidate = normalized.includes("@")
    ? normalized.split("@")[1] ?? ""
    : normalized;

  if (!candidate) {
    return null;
  }

  const parsed = parse(candidate, { allowPrivateDomains: true });

  return parsed.domain ?? null;
};

export const getEmailApexDomain = (email: string | null | undefined) =>
  getApexDomain(email);

type DomainStatus =
  | {
      apexDomain: string;
      isAllowed: boolean;
      error: PostgrestError | null;
    }
  | {
      apexDomain: null;
      isAllowed: false;
      error: PostgrestError | null;
    };

export const resolveEmailDomainStatus = async (
  supabase: SupabaseClient<Database>,
  email: string | null | undefined
): Promise<DomainStatus> => {
  const apexDomain = getEmailApexDomain(email);

  if (!apexDomain) {
    return {
      apexDomain: null,
      isAllowed: false,
      error: null,
    };
  }

  const normalizedApex = apexDomain.toLowerCase();

  const { data, error } = await supabase
    .from("allowed_signup_domains")
    .select("apex_domain")
    .ilike("apex_domain", normalizedApex)
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      apexDomain,
      isAllowed: false,
      error,
    };
  }

  return {
    apexDomain,
    isAllowed: Boolean(data),
    error: null,
  };
};
