import type { UserProfileUpdate } from '../types';

export const PROFILE_LIMITS = {
  displayNameMin: 1,
  displayNameMax: 80,
  roleMax: 60,
  restaurantMax: 80,
  specialtyMax: 80,
  yearsExperienceMin: 0,
  yearsExperienceMax: 80,
  bioMax: 300,
  contactEmailMax: 120,
  contactPhoneMax: 32,
} as const;

export function normalizePhoneNumber(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('+')) {
    return null;
  }

  const digits = trimmed.slice(1).replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return `+${digits}`;
}

export function normalizeVerificationCode(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return digits.length === 6 ? digits : null;
}

export interface ProfileFormValues {
  displayName: string;
  role: string;
  restaurant: string;
  specialty: string;
  yearsExperience: string;
  bio: string;
  contactEmail: string;
  contactPhone: string;
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

export function validateProfileForm(values: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  const displayName = values.displayName.trim();
  if (!displayName) {
    errors.displayName = 'Full name is required.';
  } else if (displayName.length > PROFILE_LIMITS.displayNameMax) {
    errors.displayName = `Name must be ${PROFILE_LIMITS.displayNameMax} characters or fewer.`;
  }

  if (values.role.trim().length > PROFILE_LIMITS.roleMax) {
    errors.role = `Role must be ${PROFILE_LIMITS.roleMax} characters or fewer.`;
  }

  if (values.restaurant.trim().length > PROFILE_LIMITS.restaurantMax) {
    errors.restaurant = `Restaurant must be ${PROFILE_LIMITS.restaurantMax} characters or fewer.`;
  }

  if (values.specialty.trim().length > PROFILE_LIMITS.specialtyMax) {
    errors.specialty = `Specialty must be ${PROFILE_LIMITS.specialtyMax} characters or fewer.`;
  }

  if (values.yearsExperience.trim() !== '') {
    const years = Number(values.yearsExperience);
    if (
      !Number.isInteger(years) ||
      years < PROFILE_LIMITS.yearsExperienceMin ||
      years > PROFILE_LIMITS.yearsExperienceMax
    ) {
      errors.yearsExperience = `Years must be a whole number (${PROFILE_LIMITS.yearsExperienceMin}–${PROFILE_LIMITS.yearsExperienceMax}).`;
    }
  }

  if (values.bio.trim().length > PROFILE_LIMITS.bioMax) {
    errors.bio = `Bio must be ${PROFILE_LIMITS.bioMax} characters or fewer.`;
  }

  const email = values.contactEmail.trim();
  if (email.length > PROFILE_LIMITS.contactEmailMax) {
    errors.contactEmail = `Email must be ${PROFILE_LIMITS.contactEmailMax} characters or fewer.`;
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.contactEmail = 'Please enter a valid email address.';
  }

  const phone = values.contactPhone.trim();
  if (phone.length > PROFILE_LIMITS.contactPhoneMax) {
    errors.contactPhone = `Phone number must be ${PROFILE_LIMITS.contactPhoneMax} characters or fewer.`;
  }

  return errors;
}

export function sanitizeProfileUpdate(values: ProfileFormValues): UserProfileUpdate {
  const parsedYears = values.yearsExperience.trim() === '' ? 0 : Math.round(Number(values.yearsExperience));
  const yearsExperience = Number.isFinite(parsedYears)
    ? Math.min(PROFILE_LIMITS.yearsExperienceMax, Math.max(PROFILE_LIMITS.yearsExperienceMin, parsedYears))
    : 0;

  return {
    displayName: values.displayName.trim().slice(0, PROFILE_LIMITS.displayNameMax) || 'Chef',
    role: values.role.trim().slice(0, PROFILE_LIMITS.roleMax),
    restaurant: values.restaurant.trim().slice(0, PROFILE_LIMITS.restaurantMax),
    specialty: values.specialty.trim().slice(0, PROFILE_LIMITS.specialtyMax),
    yearsExperience,
    bio: values.bio.trim().slice(0, PROFILE_LIMITS.bioMax),
    contactEmail: values.contactEmail.trim().slice(0, PROFILE_LIMITS.contactEmailMax),
    contactPhone: values.contactPhone.trim().slice(0, PROFILE_LIMITS.contactPhoneMax),
  };
}

export interface EmailAuthValues {
  displayName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export function validateEmailLogin(values: EmailAuthValues): string | null {
  const email = values.email.trim();
  if (!email) {
    return 'Enter your email address.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }
  if (!values.password) {
    return 'Enter your password.';
  }
  return null;
}

export function validateEmailSignUp(values: EmailAuthValues): string | null {
  const name = values.displayName?.trim() ?? '';
  if (name.length < 2) {
    return 'Enter your full name (at least 2 characters).';
  }
  if (name.length > PROFILE_LIMITS.displayNameMax) {
    return `Full name must be ${PROFILE_LIMITS.displayNameMax} characters or fewer.`;
  }
  const email = values.email.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }
  if (values.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  if (values.password !== values.confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

