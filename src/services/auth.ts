import { supabase } from "@/integrations/supabase/client";

export const authService = {
  getSession: () => supabase.auth.getSession(),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email: string, password: string, displayName?: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: displayName ? { display_name: displayName } : undefined,
      },
    }),

  sendPasswordReset: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
};
