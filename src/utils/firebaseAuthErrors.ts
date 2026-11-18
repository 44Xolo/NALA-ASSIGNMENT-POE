export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Unable to authenticate right now. Please try again.';
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  switch (code) {
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before finishing.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in yet. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable Email/Password, Phone, or Google under Firebase Console → Authentication → Sign-in method.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Log In to sign in.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password (at least 6 characters).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Check your details or sign up for a new account.';
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number including its country code, such as +27 12 345 6789.';
    case 'auth/missing-phone-number':
      return 'Enter your phone number to receive a verification code.';
    case 'auth/invalid-verification-code':
      return 'That verification code does not match. Check the SMS and try again.';
    case 'auth/code-expired':
      return 'That verification code has expired. Request a new SMS code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment before trying again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for this project. Try again later or use a Firebase test phone number.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase. Check your connection and try again.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Unable to authenticate right now. Please try again.';
  }
}
