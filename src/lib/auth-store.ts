// Lightweight auth singleton so route guards don't re-call supabase.auth.getSession()
// on every navigation. We hydrate once at app start, then keep the session in
// memory by subscribing to onAuthStateChange. beforeLoad reads from here.
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let currentSession: Session | null = null;
let initPromise: Promise<Session | null> | null = null;
let subscribed = false;

function subscribeOnce() {
  if (subscribed) return;
  subscribed = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
  });
}

export function initAuth(): Promise<Session | null> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    currentSession = data.session;
    subscribeOnce();
    return currentSession;
  })();
  return initPromise;
}

// Awaitable — first call hydrates, later calls resolve immediately from memory.
export async function getAuthSession(): Promise<Session | null> {
  if (initPromise) {
    // If already initialized, this is a microtask. Otherwise it waits for hydration.
    await initPromise;
    return currentSession;
  }
  return initAuth();
}

export function getAuthSessionSync(): Session | null {
  return currentSession;
}
