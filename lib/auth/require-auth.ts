import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RequireAuthOptions = {
  redirectToLogin?: boolean;
};

export async function requireAuth(options: RequireAuthOptions = {}) {
  const { redirectToLogin = true } = options;

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (redirectToLogin) {
      redirect("/login");
    }

    throw new Error("UNAUTHORIZED");
  }

  return { supabase, user };
}