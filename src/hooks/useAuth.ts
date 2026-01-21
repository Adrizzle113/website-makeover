import { useState, useEffect, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = "admin" | "user";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    role: null,
    isLoading: true,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const role = profile?.role ?? "user";

      setAuthState((prev) => ({
        ...prev,
        profile,
        role,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setAuthState((prev) => ({
            ...prev,
            profile: null,
            role: null,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthState({
      session: null,
      user: null,
      profile: null,
      role: null,
      isLoading: false,
    });
  }, []);

  const hasRole = useCallback(
    (role: AppRole) => authState.role === role,
    [authState.role]
  );

  return {
    ...authState,
    signOut,
    hasRole,
  };
}
