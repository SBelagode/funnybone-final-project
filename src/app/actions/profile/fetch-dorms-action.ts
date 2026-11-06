"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchDormsAction = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dorms")
    .select("id, short_name")
    .order("short_name", { ascending: true });

  if (error) {
    console.error("Error fetching dorms:", error.message);
    throw new Error("Failed to fetch dorms.");
  }

  return data;
};
