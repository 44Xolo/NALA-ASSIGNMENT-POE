import { describe, expect, it } from 'vitest';
import {
  normalizePhoneNumber,
  normalizeVerificationCode,
  validateEmailLogin,
  validateEmailSignUp,
  validateProfileForm,
} from './authValidation';

describe('normalizePhoneNumber', () => {
  it('normalizes formatted international numbers to E.164', () => {
    expect(normalizePhoneNumber('+27 82 123 4567')).toBe('+27821234567');
    expect(normalizePhoneNumber(' +1 (555) 234-5678 ')).toBe('+15552345678');
  });

  it('rejects numbers without a country code or invalid length', () => {
    expect(normalizePhoneNumber('0821234567')).toBeNull();
    expect(normalizePhoneNumber('+12345')).toBeNull();
    expect(normalizePhoneNumber('')).toBeNull();
  });
});

describe('normalizeVerificationCode', () => {
  it('accepts six-digit verification codes', () => {
    expect(normalizeVerificationCode('123456')).toBe('123456');
    expect(normalizeVerificationCode(' 123-456 ')).toBe('123456');
  });

  it('rejects incomplete codes', () => {
    expect(normalizeVerificationCode('12345')).toBeNull();
    expect(normalizeVerificationCode('abc')).toBeNull();
  });
});

describe('validateProfileForm', () => {
  it('requires displayName and validates numeric experience and email', () => {
    const errors = validateProfileForm({
      displayName: '   ',
      role: 'Executive Chef',
      restaurant: 'NALA',
      specialty: 'French Bistro',
      yearsExperience: '-2',
      bio: 'Classic cuisine',
      contactEmail: 'not-an-email',
      contactPhone: '+27 82 123 4567',
    });
    expect(errors.displayName).toBeDefined();
    expect(errors.yearsExperience).toBeDefined();
    expect(errors.contactEmail).toBeDefined();
  });

  it('accepts a valid profile payload', () => {
    const errors = validateProfileForm({
      displayName: 'Chef Christoffel',
      role: 'Executive Chef',
      restaurant: 'NALA Bistro',
      specialty: 'Contemporary French',
      yearsExperience: '12',
      bio: 'Curating seasonal menus with classic French technique.',
      contactEmail: 'chef@nala.example',
      contactPhone: '+27 82 123 4567',
    });
    expect(errors).toEqual({});
  });
});

describe('email auth validation', () => {
  it('validates login fields', () => {
    expect(validateEmailLogin({ email: 'bad', password: '123' })).toMatch(/valid email/i);
    expect(validateEmailLogin({ email: 'chef@nala.com', password: '' })).toMatch(/password/i);
    expect(validateEmailLogin({ email: 'chef@nala.com', password: 'secret' })).toBeNull();
  });

  it('validates sign-up fields including name and password match', () => {
    expect(
      validateEmailSignUp({
        displayName: 'A',
        email: 'chef@nala.com',
        password: 'password1',
        confirmPassword: 'password1',
      }),
    ).toMatch(/full name/i);
    expect(
      validateEmailSignUp({
        displayName: 'Chef Nala',
        email: 'chef@nala.com',
        password: 'password1',
        confirmPassword: 'password2',
      }),
    ).toMatch(/do not match/i);
    expect(
      validateEmailSignUp({
        displayName: 'Chef Nala',
        email: 'chef@nala.com',
        password: 'password1',
        confirmPassword: 'password1',
      }),
    ).toBeNull();
  });
});

