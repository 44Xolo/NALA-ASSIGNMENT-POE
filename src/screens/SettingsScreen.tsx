import {
  Award,
  Building2,
  CheckCircle2,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import FormField from '../components/FormField';
import Header from '../components/Header';
import type { MenuItem, UserProfile, UserProfileUpdate } from '../types';
import {
  PROFILE_LIMITS,
  sanitizeProfileUpdate,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '../utils/authValidation';

interface Props {
  profile: UserProfile | null;
  photoUrl: string | null;
  emailVerified: boolean;
  fallbackName: string;
  fallbackEmail: string;
  fallbackPhone: string;
  menuItems: MenuItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSaveProfile: (updates: UserProfileUpdate) => Promise<void>;
  onResendVerification: () => Promise<void>;
  onCheckVerification: () => Promise<void>;
  onSaved: () => void;
  onInvalid: () => void;
  onSignOut: () => void;
}

function toFormValues(
  profile: UserProfile | null,
  fallbackName: string,
  fallbackEmail: string,
  fallbackPhone: string,
): ProfileFormValues {
  return {
    displayName: profile?.displayName ?? fallbackName,
    role: profile?.role ?? 'Executive Chef',
    restaurant: profile?.restaurant ?? 'NALA Bistro',
    specialty: profile?.specialty ?? '',
    yearsExperience: profile ? String(profile.yearsExperience) : '0',
    bio: profile?.bio ?? '',
    contactEmail: profile?.contactEmail ?? fallbackEmail,
    contactPhone: profile?.contactPhone ?? fallbackPhone,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const inputClass = (hasError: boolean) =>
  `h-12 w-full rounded-xl bg-black/40 px-3 text-white placeholder-white/40 outline-none focus:ring-1 ${
    hasError ? 'ring-1 ring-red-400' : 'focus:ring-nala-gold'
  }`;

export default function SettingsScreen({
  profile,
  photoUrl,
  emailVerified,
  fallbackName,
  fallbackEmail,
  fallbackPhone,
  menuItems,
  loading,
  saving,
  error,
  onSaveProfile,
  onResendVerification,
  onCheckVerification,
  onSaved,
  onInvalid,
  onSignOut,
}: Props) {
  const [values, setValues] = useState<ProfileFormValues>(() =>
    toFormValues(profile, fallbackName, fallbackEmail, fallbackPhone),
  );
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [verifyingAction, setVerifyingAction] = useState<'resend' | 'check' | null>(null);

  useEffect(() => {
    setValues(toFormValues(profile, fallbackName, fallbackEmail, fallbackPhone));
  }, [profile, fallbackName, fallbackEmail, fallbackPhone]);

  const update = <K extends keyof ProfileFormValues>(key: K, val: ProfileFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: val }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      onInvalid();
      return;
    }

    try {
      await onSaveProfile(sanitizeProfileUpdate(values));
      onSaved();
    } catch {
      // Error state is recorded by useUserProfile and logged via handleFirestoreError.
    }
  };

  const displayName = profile?.displayName || fallbackName || 'Chef';
  const roleLabel = profile?.role || 'Culinary Staff';
  const restaurantLabel = profile?.restaurant || 'NALA Kitchen';
  const availableCount = menuItems.filter((item) => item.isAvailable).length;

  const providerLabel =
    profile?.authProvider === 'phone'
      ? 'Phone SMS Verified'
      : profile?.authProvider === 'email'
        ? emailVerified
          ? 'Email Verified'
          : 'Email Verification Pending'
        : 'Gmail Verified';

  const needsEmailVerification = profile?.authProvider === 'email' && !emailVerified;

  return (
    <>
      <Header title="Settings" />

      <div className="space-y-4 px-4 pb-6">
        {needsEmailVerification && (
          <section
            aria-label="Email verification notice"
            className="rounded-2xl border border-nala-gold/40 bg-nala-card p-4"
          >
            <p className="text-sm font-medium text-nala-gold">Verify your email to sync your profile</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              We sent a verification link to {fallbackEmail}. Confirm your email to sync your profile to the cloud.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={verifyingAction !== null}
                onClick={() => {
                  setVerifyingAction('check');
                  void onCheckVerification().finally(() => setVerifyingAction(null));
                }}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-nala-gold text-xs font-semibold text-black disabled:opacity-50"
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                {verifyingAction === 'check' ? 'Checking…' : "I've verified"}
              </button>
              <button
                type="button"
                disabled={verifyingAction !== null}
                onClick={() => {
                  setVerifyingAction('resend');
                  void onResendVerification().finally(() => setVerifyingAction(null));
                }}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-black/40 text-xs font-medium text-white/85 disabled:opacity-50"
              >
                <RefreshCw size={14} aria-hidden="true" />
                {verifyingAction === 'resend' ? 'Sending…' : 'Resend email'}
              </button>
            </div>
          </section>
        )}

        <section aria-labelledby="chef-profile-card" className="rounded-2xl bg-nala-card p-4">
          <div className="flex items-start gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-full border border-nala-gold/60 object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-nala-gold/60 bg-black/40 font-display text-xl text-nala-gold"
              >
                {getInitials(displayName)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 id="chef-profile-card" className="truncate font-display text-xl text-white">
                {displayName}
              </h2>
              <p className="mt-0.5 text-sm text-nala-gold">{roleLabel}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <Building2 size={13} aria-hidden="true" className="text-nala-gold/80" />
                  {restaurantLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={13} aria-hidden="true" className="text-nala-gold/80" />
                  {providerLabel}
                </span>
              </div>
            </div>
          </div>

          {profile?.bio && (
            <p className="mt-4 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/75">
              {profile.bio}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs">
            <div>
              <dt className="text-white/50">Specialty</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-white">
                <Utensils size={13} aria-hidden="true" className="shrink-0 text-nala-gold" />
                <span className="truncate">{profile?.specialty || 'Not set'}</span>
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Experience</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-white">
                <Award size={13} aria-hidden="true" className="shrink-0 text-nala-gold" />
                <span>
                  {profile?.yearsExperience ?? 0} {(profile?.yearsExperience ?? 0) === 1 ? 'year' : 'years'}
                </span>
              </dd>
            </div>
            {profile?.contactEmail && (
              <div className="col-span-2">
                <dt className="text-white/50">Email</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-white/85">
                  <Mail size={13} aria-hidden="true" className="shrink-0 text-nala-gold" />
                  <span className="truncate">{profile.contactEmail}</span>
                </dd>
              </div>
            )}
            {profile?.contactPhone && (
              <div className="col-span-2">
                <dt className="text-white/50">Phone</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-white/85">
                  <Phone size={13} aria-hidden="true" className="shrink-0 text-nala-gold" />
                  <span>{profile.contactPhone}</span>
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section aria-labelledby="edit-profile-heading" className="rounded-2xl bg-nala-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="edit-profile-heading" className="font-display text-lg text-white">
                Profile Information
              </h2>
              <p className="text-xs text-white/55">Update your professional chef &amp; contact details</p>
            </div>
            {loading && <span className="text-xs text-nala-gold">Loading…</span>}
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-xl bg-black/50 p-3 text-xs text-red-300">
              {error}
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <FormField id="profile-name" label="Full name" error={errors.displayName}>
              <input
                id="profile-name"
                type="text"
                maxLength={PROFILE_LIMITS.displayNameMax}
                value={values.displayName}
                onChange={(e) => update('displayName', e.target.value)}
                placeholder="e.g. Chef Christoffel"
                aria-invalid={!!errors.displayName}
                className={inputClass(!!errors.displayName)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="profile-role" label="Role / title" error={errors.role}>
                <input
                  id="profile-role"
                  type="text"
                  maxLength={PROFILE_LIMITS.roleMax}
                  value={values.role}
                  onChange={(e) => update('role', e.target.value)}
                  placeholder="Executive Chef"
                  aria-invalid={!!errors.role}
                  className={inputClass(!!errors.role)}
                />
              </FormField>

              <FormField id="profile-experience" label="Years exp." error={errors.yearsExperience}>
                <input
                  id="profile-experience"
                  type="number"
                  min={PROFILE_LIMITS.yearsExperienceMin}
                  max={PROFILE_LIMITS.yearsExperienceMax}
                  inputMode="numeric"
                  value={values.yearsExperience}
                  onChange={(e) => update('yearsExperience', e.target.value)}
                  placeholder="e.g. 8"
                  aria-invalid={!!errors.yearsExperience}
                  className={inputClass(!!errors.yearsExperience)}
                />
              </FormField>
            </div>

            <FormField id="profile-restaurant" label="Restaurant / kitchen" error={errors.restaurant}>
              <input
                id="profile-restaurant"
                type="text"
                maxLength={PROFILE_LIMITS.restaurantMax}
                value={values.restaurant}
                onChange={(e) => update('restaurant', e.target.value)}
                placeholder="e.g. NALA Bistro"
                aria-invalid={!!errors.restaurant}
                className={inputClass(!!errors.restaurant)}
              />
            </FormField>

            <FormField id="profile-specialty" label="Culinary specialty" error={errors.specialty}>
              <input
                id="profile-specialty"
                type="text"
                maxLength={PROFILE_LIMITS.specialtyMax}
                value={values.specialty}
                onChange={(e) => update('specialty', e.target.value)}
                placeholder="e.g. Classical French & Pastry"
                aria-invalid={!!errors.specialty}
                className={inputClass(!!errors.specialty)}
              />
            </FormField>

            <FormField id="profile-email" label="Contact email" error={errors.contactEmail}>
              <input
                id="profile-email"
                type="email"
                maxLength={PROFILE_LIMITS.contactEmailMax}
                value={values.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                placeholder="chef@nala.restaurant"
                aria-invalid={!!errors.contactEmail}
                className={inputClass(!!errors.contactEmail)}
              />
            </FormField>

            <FormField id="profile-phone" label="Contact phone" error={errors.contactPhone}>
              <input
                id="profile-phone"
                type="tel"
                maxLength={PROFILE_LIMITS.contactPhoneMax}
                value={values.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                placeholder="+27 82 123 4567"
                aria-invalid={!!errors.contactPhone}
                className={inputClass(!!errors.contactPhone)}
              />
            </FormField>

            <FormField
              id="profile-bio"
              label="Professional bio"
              error={errors.bio}
              hint={`${values.bio.length}/${PROFILE_LIMITS.bioMax}`}
            >
              <textarea
                id="profile-bio"
                rows={3}
                maxLength={PROFILE_LIMITS.bioMax}
                value={values.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Share your culinary background, philosophy, or kitchen responsibilities"
                aria-invalid={!!errors.bio}
                className="w-full rounded-xl bg-black/40 p-3 text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-nala-gold"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving || loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nala-gold font-semibold text-black disabled:opacity-50"
            >
              <Save size={18} aria-hidden="true" />
              {saving ? 'Saving profile…' : 'Save profile'}
            </button>
          </form>
        </section>

        <section aria-labelledby="workspace-account-heading" className="rounded-2xl bg-nala-card p-4">
          <h2 id="workspace-account-heading" className="font-display text-lg text-white">
            Kitchen &amp; Account
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Active menu dishes</dt>
              <dd className="text-white">
                {availableCount} available of {menuItems.length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Sign-in status</dt>
              <dd className="text-nala-gold">{providerLabel}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={onSignOut}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/40 text-sm font-medium text-white/85"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </section>
      </div>
    </>
  );
}
