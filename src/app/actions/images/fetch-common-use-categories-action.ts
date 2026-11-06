"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchCommonUseCategoriesAction = async () => {
  const supabase = await createClient();

  try {
    // Query the database for common use categories
    const { data, error } = await supabase
      .from("common_use_categories")
      .select("id, name, created_datetime_utc, modified_datetime_utc")
      .order("name");

    if (error) {
      console.error("Error fetching common use categories:", error.message);
      throw new Error("Failed to fetch common use categories");
    }

    if (!data) {
      console.warn("No categories found in the database");
      return [];
    }

    // Transform the data to match our expected types
    const categories = data.map((category) => ({
      id: Number(category.id), // Convert bigint to number
      name: category.name,
      created_datetime_utc: category.created_datetime_utc,
      modified_datetime_utc: category.modified_datetime_utc,
      description: null, // Since it's not in the schema, we'll set it to null
    }));

    return categories;
  } catch (error) {
    console.error("Error in fetchCommonUseCategoriesAction:", error);
    throw error;
  }
};
