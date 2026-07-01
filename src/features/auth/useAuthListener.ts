import { useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { getCurrentProfile } from '../../api/auth';
import { useAppDispatch } from '../../store/hooks';
import { sessionLoaded, profileLoaded, signedOut } from '../../store/authSlice';

/**
 * Mount once near the root of the app. Listens to Supabase auth state
 * and keeps the Redux `auth` slice (session + profile/role) in sync.
 * This is the ONLY place auth state should be written to Redux.
 */
export function useAuthListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Check for an existing session on first load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        dispatch(sessionLoaded({ userId: session.user.id, email: session.user.email! }));
        const profile = await getCurrentProfile(session.user.id);
        dispatch(profileLoaded(profile));
      } else {
        dispatch(sessionLoaded(null));
      }
    });

    // 2. Subscribe to future auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        dispatch(sessionLoaded({ userId: session.user.id, email: session.user.email! }));
        const profile = await getCurrentProfile(session.user.id);
        dispatch(profileLoaded(profile));
      } else {
        dispatch(signedOut());
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [dispatch]);
}
