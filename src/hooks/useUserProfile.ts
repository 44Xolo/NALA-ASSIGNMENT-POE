import { updateProfile, type User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { AuthProviderKind, UserProfile, UserProfileUpdate } from '../types';
import { PROFILE_LIMITS } from '../utils/authValidation';

interface UseUserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveProfile: (updates: UserProfileUpdate) => Promise<void>;
}

const DRAFT_PREFIX = 'nala.profileDraft.';

export function savePendingProfileDraft(
  uid: string,
  draft: Partial<UserProfileUpdate>,
): void {
  try {
    const existing = loadPendingProfileDraft(uid) ?? {};
    localStorage.setItem(`${DRAFT_PREFIX}${uid}`, JSON.stringify({ ...existing, ...draft }));
  } catch {
    // Ignore storage unavailability
  }
}

function loadPendingProfileDraft(uid: string): Partial<UserProfileUpdate> | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Partial<UserProfileUpdate>) : null;
  } catch {
    return null;
  }
}

function clearPendingProfileDraft(uid: string): void {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${uid}`);
  } catch {
    // Ignore storage unavailability
  }
}

export function getProviderKind(user: User): AuthProviderKind {
  if (user.providerData.some((p) => p.providerId === 'phone') || (!user.email && !!user.phoneNumber)) {
    return 'phone';
  }
  if (user.providerData.some((p) => p.providerId === 'password')) {
    return 'email';
  }
  return 'google';
}

function buildLocalProfile(user: User): UserProfile {
  const provider = getProviderKind(user);
  const draft = loadPendingProfileDraft(user.uid);
  const rawName =
    draft?.displayName?.trim() ||
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    user.phoneNumber ||
    'Chef';

  return {
    uid: user.uid,
    displayName: rawName.slice(0, PROFILE_LIMITS.displayNameMax) || 'Chef',
    role: (draft?.role ?? 'Executive Chef').slice(0, PROFILE_LIMITS.roleMax),
    restaurant: (draft?.restaurant ?? 'NALA Bistro').slice(0, PROFILE_LIMITS.restaurantMax),
    specialty: (draft?.specialty ?? '').slice(0, PROFILE_LIMITS.specialtyMax),
    yearsExperience: draft?.yearsExperience ?? 0,
    bio: (draft?.bio ?? '').slice(0, PROFILE_LIMITS.bioMax),
    contactEmail: (draft?.contactEmail ?? user.email ?? '').slice(0, PROFILE_LIMITS.contactEmailMax),
    contactPhone: (draft?.contactPhone ?? user.phoneNumber ?? '').slice(0, PROFILE_LIMITS.contactPhoneMax),
    authProvider: provider,
  };
}

export function useUserProfile(user: User | null, emailVerified: boolean): UseUserProfileState {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = useRef<string | null>(null);

  const canSyncFirestore = Boolean(user && (emailVerified || getProviderKind(user) === 'phone'));

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      creatingRef.current = null;
      return;
    }

    if (!canSyncFirestore) {
      setProfile(buildLocalProfile(user));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const profilePath = `users/${user.uid}`;
    const ref = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          if (creatingRef.current !== user.uid) {
            creatingRef.current = user.uid;
            const initial = buildLocalProfile(user);
            void setDoc(ref, {
              ...initial,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
              .then(() => {
                clearPendingProfileDraft(user.uid);
              })
              .catch((err) => {
                setLoading(false);
                setError('Unable to initialize your profile.');
                handleFirestoreError(err, OperationType.CREATE, profilePath);
              });
          }
          return;
        }

        const data = snapshot.data() as UserProfile;
        setProfile(data);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError('Unable to load your profile.');
        handleFirestoreError(err, OperationType.GET, profilePath);
      },
    );

    return () => unsubscribe();
  }, [user, canSyncFirestore]);

  const saveProfile = useCallback(
    async (updates: UserProfileUpdate) => {
      if (!user) return;
      const sanitized: UserProfileUpdate = {
        displayName: updates.displayName.slice(0, PROFILE_LIMITS.displayNameMax),
        role: updates.role.slice(0, PROFILE_LIMITS.roleMax),
        restaurant: updates.restaurant.slice(0, PROFILE_LIMITS.restaurantMax),
        specialty: updates.specialty.slice(0, PROFILE_LIMITS.specialtyMax),
        yearsExperience: Math.min(
          PROFILE_LIMITS.yearsExperienceMax,
          Math.max(PROFILE_LIMITS.yearsExperienceMin, Math.round(updates.yearsExperience)),
        ),
        bio: updates.bio.slice(0, PROFILE_LIMITS.bioMax),
        contactEmail: updates.contactEmail.slice(0, PROFILE_LIMITS.contactEmailMax),
        contactPhone: updates.contactPhone.slice(0, PROFILE_LIMITS.contactPhoneMax),
      };

      setSaving(true);
      setError(null);

      try {
        if (sanitized.displayName !== user.displayName) {
          await updateProfile(user, { displayName: sanitized.displayName });
        }

        if (!canSyncFirestore) {
          savePendingProfileDraft(user.uid, sanitized);
          setProfile((prev) => ({
            ...(prev ?? buildLocalProfile(user)),
            ...sanitized,
          }));
          return;
        }

        const ref = doc(db, 'users', user.uid);
        await updateDoc(ref, {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setError('Unable to save profile changes.');
        if (canSyncFirestore) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user, canSyncFirestore],
  );

  return { profile, loading, saving, error, saveProfile };
}
