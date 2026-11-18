import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';

interface FirebaseAuthState {
  auth: Auth;
  user: User | null;
  emailVerified: boolean;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<boolean>;
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [state, setState] = useState<{
    user: User | null;
    emailVerified: boolean;
    loading: boolean;
    error: string | null;
  }>({
    user: auth.currentUser,
    emailVerified: auth.currentUser?.emailVerified ?? false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) =>
        setState({
          user,
          emailVerified: user?.emailVerified ?? false,
          loading: false,
          error: null,
        }),
      (error) => {
        console.error('Unable to check Firebase sign-in state.', error);
        setState({
          user: null,
          emailVerified: false,
          loading: false,
          error: getFirebaseAuthErrorMessage(error),
        });
      },
    );
    return () => unsubscribe();
  }, []);

  const refreshUser = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    await current.getIdToken(true);
    const updated = auth.currentUser;
    setState((prev) => ({
      ...prev,
      user: updated,
      emailVerified: updated?.emailVerified ?? false,
    }));
    return updated?.emailVerified ?? false;
  }, []);

  return {
    auth,
    user: state.user,
    emailVerified: state.emailVerified,
    loading: state.loading,
    error: state.error,
    refreshUser,
  };
}
