import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';
import { Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { savePendingProfileDraft } from '../hooks/useUserProfile';
import {
  normalizePhoneNumber,
  normalizeVerificationCode,
  PROFILE_LIMITS,
  validateEmailLogin,
  validateEmailSignUp,
} from '../utils/authValidation';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';

interface Props {
  auth: Auth;
  authError: string | null;
}

type AuthMode = 'login' | 'signup';
type AuthMethod = 'email' | 'phone';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function GoogleGIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#EA4335"
        d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.75 14.97 1 12 1 7.39 1 3.41 3.65 1.48 7.52l3.68 2.86C6.02 7.21 8.77 5 12 5Z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68l3.71 2.88c2.17-2 3.71-4.94 3.71-8.8Z"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.38A7.12 7.12 0 0 1 4.78 12c0-.83.14-1.63.38-2.38L1.48 6.76A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.48 5.24l3.68-2.86Z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.24 0 5.95-1.08 7.93-2.93l-3.71-2.88c-1.08.72-2.45 1.16-4.22 1.16-3.23 0-5.98-2.21-6.84-5.21l-3.68 2.86C3.41 20.35 7.39 23 12 23Z"
      />
    </svg>
  );
}

const pillInputClass =
  'h-12 w-full rounded-full bg-[#363532]/85 pl-12 pr-4 text-sm text-white placeholder-white/60 backdrop-blur-sm outline-none ring-1 ring-white/10 focus:ring-nala-gold';

export default function LoginScreen({ auth, authError }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>('email');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const [pending, setPending] = useState<'google' | 'email' | 'phone' | 'code' | null>(null);
  const [error, setError] = useState('');

  const recaptchaContainer = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const clearRecaptcha = () => {
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = null;
  };

  useEffect(() => clearRecaptcha, []);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setConfirmation(null);
    setVerificationCode('');
  };

  const toggleMethod = () => {
    setMethod((prev) => (prev === 'email' ? 'phone' : 'email'));
    setError('');
    setConfirmation(null);
    setVerificationCode('');
  };

  const handleGoogleAuth = async () => {
    setPending('google');
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (signInError) {
      setError(getFirebaseAuthErrorMessage(signInError));
    } finally {
      setPending(null);
    }
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (mode === 'login') {
      const validationError = validateEmailLogin({ email, password });
      if (validationError) {
        setError(validationError);
        return;
      }

      setPending('email');
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInError) {
        setError(getFirebaseAuthErrorMessage(signInError));
      } finally {
        setPending(null);
      }
      return;
    }

    const validationError = validateEmailSignUp({
      displayName: fullName,
      email,
      password,
      confirmPassword,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending('email');
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const trimmedName = fullName.trim().slice(0, PROFILE_LIMITS.displayNameMax);

      savePendingProfileDraft(credential.user.uid, {
        displayName: trimmedName,
        contactEmail: email.trim().slice(0, PROFILE_LIMITS.contactEmailMax),
      });

      await updateProfile(credential.user, { displayName: trimmedName });
      try {
        await sendEmailVerification(credential.user);
      } catch {
        // Verification email can also be sent from Settings.
      }
    } catch (signUpError) {
      setError(getFirebaseAuthErrorMessage(signUpError));
    } finally {
      setPending(null);
    }
  };

  const requestPhoneCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recaptchaContainer.current) return;

    if (mode === 'signup' && fullName.trim().length > 0 && fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      setError('Include your country code, for example +27 12 345 6789.');
      return;
    }

    setPending('phone');
    setError('');

    try {
      clearRecaptcha();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainer.current, { size: 'invisible' });
      recaptchaVerifier.current = verifier;
      const result = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
      setPhoneNumber(normalizedPhone);
      setConfirmation(result);
    } catch (sendError) {
      setError(getFirebaseAuthErrorMessage(sendError));
      clearRecaptcha();
    } finally {
      setPending(null);
    }
  };

  const verifyPhoneCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmation) return;

    const code = normalizeVerificationCode(verificationCode);
    if (!code) {
      setError('Enter the six-digit code sent to your phone.');
      return;
    }

    setPending('code');
    setError('');

    try {
      const credential = await confirmation.confirm(code);
      if (mode === 'signup' && fullName.trim()) {
        const trimmedName = fullName.trim().slice(0, PROFILE_LIMITS.displayNameMax);
        savePendingProfileDraft(credential.user.uid, {
          displayName: trimmedName,
          contactPhone: phoneNumber,
        });
        await updateProfile(credential.user, { displayName: trimmedName });
      }
    } catch (verifyError) {
      setError(getFirebaseAuthErrorMessage(verifyError));
    } finally {
      setPending(null);
    }
  };

  const changePhoneNumber = () => {
    clearRecaptcha();
    setConfirmation(null);
    setVerificationCode('');
    setError('');
  };

  return (
    <div
      className="flex min-h-screen flex-col justify-between bg-cover bg-center px-6 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10, 10, 10, 0.62), rgba(10, 10, 10, 0.85)), url('/images/restaurant-interior.jpg')",
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <h1 className="text-center font-display text-5xl tracking-[0.14em] text-white">NALA</h1>
        <p className="mt-5 text-center font-display text-2xl text-white">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </p>
        <p className="mt-1.5 text-center font-display text-sm text-white/80">
          {mode === 'login'
            ? 'Sign in to continue to your dining experience'
            : 'Sign up to manage your menu & chef profile'}
        </p>

        {(authError || error) && (
          <p role="alert" className="mt-4 rounded-2xl bg-black/75 px-4 py-3 text-center text-xs text-red-300">
            {error || authError}
          </p>
        )}

        {method === 'email' ? (
          <form onSubmit={(e) => void handleEmailAuth(e)} noValidate className="mt-7 space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-fullname" className="mb-1.5 block font-display text-sm text-white/90">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon
                    size={18}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
                  />
                  <input
                    id="auth-fullname"
                    type="text"
                    autoComplete="name"
                    maxLength={PROFILE_LIMITS.displayNameMax}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError('');
                    }}
                    placeholder="Chef Christoffel"
                    className={pillInputClass}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-email" className="font-display text-sm text-white/90">
                  Email / Username
                </label>
                <button
                  type="button"
                  onClick={toggleMethod}
                  className="text-xs text-[#C9A86A] underline"
                >
                  Use phone number
                </button>
              </div>
              <div className="relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
                />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Email"
                  className={pillInputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
                />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Password"
                  className={`${pillInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-black/80"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
                  />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm password"
                    className={pillInputClass}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={pending !== null}
                className="h-12 w-full rounded-full bg-[#F2C019] text-base font-bold tracking-wider text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending === 'email'
                  ? mode === 'signup'
                    ? 'CREATING ACCOUNT…'
                    : 'LOGGING IN…'
                  : mode === 'signup'
                    ? 'SIGN UP'
                    : 'LOGIN'}
              </button>

              <button
                type="button"
                onClick={() => void handleGoogleAuth()}
                disabled={pending !== null}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#363532]/90 font-display text-sm text-white backdrop-blur-sm ring-1 ring-white/10 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GoogleGIcon />
                {pending === 'google'
                  ? 'Connecting to Google…'
                  : mode === 'signup'
                    ? 'Sign up by Google'
                    : 'Continue with Google'}
              </button>
            </div>
          </form>
        ) : confirmation ? (
          <form onSubmit={(e) => void verifyPhoneCode(e)} noValidate className="mt-7 space-y-4">
            <p className="text-center text-sm text-white/80">Enter the 6-digit code sent to {phoneNumber}</p>
            <div className="relative">
              <Phone
                size={18}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
              />
              <input
                id="verification-code"
                name="one-time-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(event) => {
                  setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="123456"
                aria-label="SMS verification code"
                className={pillInputClass}
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={pending !== null}
                className="h-12 w-full rounded-full bg-[#F2C019] text-base font-bold tracking-wider text-black disabled:opacity-50"
              >
                {pending === 'code' ? 'VERIFYING…' : mode === 'signup' ? 'VERIFY & SIGN UP' : 'VERIFY & LOGIN'}
              </button>
              <button
                type="button"
                onClick={changePhoneNumber}
                disabled={pending !== null}
                className="min-h-[40px] w-full text-xs text-white/75 underline"
              >
                Use a different phone number
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void requestPhoneCode(e)} noValidate className="mt-7 space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="phone-fullname" className="mb-1.5 block font-display text-sm text-white/90">
                  Full Name <span className="text-xs text-white/50">(optional)</span>
                </label>
                <div className="relative">
                  <UserIcon
                    size={18}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
                  />
                  <input
                    id="phone-fullname"
                    type="text"
                    autoComplete="name"
                    maxLength={PROFILE_LIMITS.displayNameMax}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError('');
                    }}
                    placeholder="Chef Christoffel"
                    className={pillInputClass}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="phone-number" className="font-display text-sm text-white/90">
                  Phone Number
                </label>
                <button
                  type="button"
                  onClick={toggleMethod}
                  className="text-xs text-[#C9A86A] underline"
                >
                  Use email instead
                </button>
              </div>
              <div className="relative">
                <Phone
                  size={18}
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/80"
                />
                <input
                  id="phone-number"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(event) => {
                    setPhoneNumber(event.target.value);
                    setError('');
                  }}
                  placeholder="+27 12 345 6789"
                  className={pillInputClass}
                />
              </div>
            </div>

            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={pending !== null}
                className="h-12 w-full rounded-full bg-[#F2C019] text-sm font-bold tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending === 'phone' ? 'SENDING CODE…' : 'SEND SMS CODE'}
              </button>

              <button
                type="button"
                onClick={() => void handleGoogleAuth()}
                disabled={pending !== null}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#363532]/90 font-display text-sm text-white backdrop-blur-sm ring-1 ring-white/10 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GoogleGIcon />
                {pending === 'google'
                  ? 'Connecting to Google…'
                  : mode === 'signup'
                    ? 'Sign up by Google'
                    : 'Continue with Google'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-5 text-center font-display text-xs text-white/85">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-[#C9A86A] underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#C9A86A] underline"
              >
                Log in
              </button>
            </>
          )}
        </p>

        <div ref={recaptchaContainer} />
      </div>

      <p className="mt-8 text-center font-display text-xs text-[#C9A86A]/90">
        Fine dining, reserved for you
      </p>
    </div>
  );
}
