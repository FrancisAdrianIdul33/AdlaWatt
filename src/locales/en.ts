// ============================================================
// ENGLISH (source language — every string is written here
// first; fil/ceb mirror these keys exactly)
// Pilot scope: auth screens + Menu language picker.
// ============================================================

const en = {
  common: {
    or: "OR",
    resendIn: "Resend in {{seconds}}s",
    resending: "Resending...",
    wentWrong: "Something went wrong. Please try again.",
    noConnection:
      "No connection. Check your internet and try again.",
    tooManyRequests:
      "Too many requests. Please wait a moment and try again.",
    confirmationThrottled:
      "A confirmation email was sent recently. Please wait before requesting another.",
    authRequired: "No authenticated user found.",
    accountLoadFailed:
      "Unable to load your account information.",
  },

  validation: {
    emailRequired: "Please enter your email address.",
    emailInvalid: "Please enter a valid email address.",
    usernameRequired: "Please enter a username.",
    usernameShort: "Username must be at least 3 characters.",
    usernameLong:
      "Username must not exceed 30 characters.",
    usernameChars:
      "Username can only contain letters, numbers, and underscores.",
    passwordShort: "Password must be at least 8 characters.",
    passwordLong: "Password must not exceed 72 characters.",
    passwordsMismatch:
      "Passwords do not match. Please check both password fields.",
    identifierRequired:
      "Please enter your username or email and password.",
    identifierEmpty: "Please enter your username or email.",
    passwordEmpty: "Please enter your password.",
    termsRequired:
      "Please agree to the Terms and Conditions.",
    termsRequiredLong:
      "Please agree to the Terms and Conditions before creating your account.",
  },

  passwordInput: {
    labelPassword: "Password",
    labelNewPassword: "New Password",
    labelConfirmNewPassword: "Confirm New Password",
    placeholderPassword: "Enter your password",
    placeholderNewPassword: "Create a password",
    placeholderConfirmPassword: "Confirm your password",
    placeholderCreateNew: "Create a new password",
    placeholderConfirmNew: "Confirm your new password",
    showA11y: "Show password for 5 seconds",
    showHint: "Shows password for 5 seconds",
    hideA11y:
      "Hide password, auto-hides in {{seconds}} seconds",
    hideHint:
      "Password is visible and will hide automatically",
    visibleLive:
      "Password visible, hides in {{seconds}} seconds",
    visibleHint: "Showing password… hides in {{seconds}}s",
  },

  auth: {
    login: {
      title: "Welcome Back",
      subtitle: "Sign in to continue using AdlaWatt.",
      identifierLabel: "Username or Email",
      identifierPlaceholder:
        "Enter your username or email",
      forgotPassword: "Forgot Password?",
      forgotPasswordLabel: "Forgot password",
      forgotPasswordHint: "Recover your password via email",
      signIn: "Sign In",
      signingIn: "Signing In...",
      dividerOr: "OR",
      continueWithGoogle: "Continue with Google",
      connecting: "Connecting...",
      googleA11y: "Continue with Google",
      googleHint: "Sign in with your Google account",
      invalidCredentials:
        "The username or password is incorrect.",
      signInFailed:
        "We could not sign you in. Please check your information and try again.",
      sessionFailed: "Unable to create a login session.",
      sessionFailedNow:
        "Unable to sign in right now. Please try again.",
      emailNotConfirmed:
        "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
      tooManyAttempts:
        "Too many sign-in attempts. Please wait a moment and try again.",
      googleUnavailable:
        "Google sign-in is unavailable right now. Please try again.",
      googleIncomplete:
        "Google sign-in was not completed. Please try again.",
      googleFailed:
        "Unable to sign in with Google right now. Please try again.",
      verifyTitle: "Verify Your Email",
      verifySent: "• Sent",
      verifyTo: "To:",
      verifyBody:
        "Your account needs verification before you can sign in.",
      verifySentFresh:
        "We've just sent a fresh confirmation link. Check your inbox.",
      verifySentRecent:
        "A link was sent recently. Tap resend below if it hasn't arrived.",
      verifySendFresh:
        "Tap resend below for a new confirmation link.",
      resendConfirmation: "Resend confirmation email",
      footerPrompt: "Don't have an account?",
      footerAction: "Create Account",
      testAdminTitle: "Test admin account (dev only)",
      testAdminHint:
        "Sign in with these credentials to preview the admin dashboard.",
      testAdminEmailLabel: "Email",
      testAdminUsernameLabel: "Username",
      testAdminPasswordLabel: "Password",
    },

    register: {
      title: "Create Account",
      subtitle:
        "Create your AdlaWatt account to start monitoring your energy.",
      usernameLabel: "Username",
      usernamePlaceholder: "Enter your username",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email",
      agreePrefix: "I agree to the ",
      termsLink: "Terms and Conditions",
      agreeA11y: "Agree to Terms and Conditions",
      openTermsA11y: "Open Terms and Conditions",
      createAccount: "Create Account",
      creatingAccount: "Creating Account...",
      accountFailed: "Unable to create your account.",
      accountTaken:
        "Unable to create your account with these details. Try signing in instead.",
      tooManyAttempts:
        "Too many attempts. Please wait a moment and try again.",
      accountNotCreated: "Account could not be created.",
      accountFailedNow:
        "Unable to create your account. Please try again.",
      checkEmailTitle: "Check your email",
      confirmationSent:
        "We sent a confirmation link to {{email}}. Click the link to verify your account, then sign in.",
      resendConfirmation: "Resend confirmation email",
      continueToSignIn: "Continue to Sign In",
      useDifferentEmail: "Use a different email address",
      useDifferentEmailA11y: "Use a different email address",
      resendFailed: "Unable to resend confirmation email.",
      footerPrompt: "Already have an account?",
      footerAction: "Sign In",
      googleHint: "Create your account with Google",
    },

    forgot: {
      title: "Reset Password",
      subtitleRequest:
        "Enter your account email. We'll send you a recovery link.",
      subtitleVerified:
        "Your email is confirmed. Continue to your account or set a new password.",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email",
      sendLink: "Send Recovery Link",
      sending: "Sending...",
      sendFailed:
        "Unable to send a recovery email right now. Please try again.",
      recoveryThrottled:
        "A recovery email was sent recently. Please wait before requesting another.",
      recoveryFailed:
        "Unable to send a recovery email right now. Please try again.",
      recoveryLinkBad:
        "This recovery link is invalid or has expired. Request a new one below.",
      recoveryLinkWrong:
        "This link is not a password recovery link. Request a new recovery email below.",
      recoveryExpired:
        "This recovery link is invalid or has expired. Request a new one.",
      recoveryUpdateFailed:
        "Unable to update your password right now. Please try again.",
      checkEmailTitle: "Check Your Email",
      checkEmailSent: "• Sent",
      checkEmailTo: "To:",
      checkEmailInbox: "your inbox",
      checkEmailBody:
        "We sent a recovery link. Tap it, then set a new password.",
      resendRecovery: "Resend recovery email",
      checkEmailHint:
        "Didn't get it? Check spam or try a different address.",
      verifyingTitle: "Verifying Link",
      verifyingBody: "Verifying your recovery link…",
      verifiedTitle: "Email Confirmed",
      verifiedBody:
        "You have successfully confirmed your email.",
      continueToAccount: "Continue to Account",
      showChangeForm: "Or you want to change your password?",
      hideChangeForm: "Hide password fields",
      showChangeFormA11y: "Show password change form",
      hideChangeFormA11y: "Hide password change form",
      changeFormHint: "Reveals the new password fields",
      updatePassword: "Update Password",
      updating: "Updating...",
      recoveryEmailSent: "Recovery email sent",
      verifyingLink: "Verifying recovery link",
      emailConfirmed: "Email confirmed",
      footerPrompt: "Remembered your password?",
      footerAction: "Back to Sign In",
    },

    callback: {
      title: "Email Confirmation",
      subtitle: "Confirming your AdlaWatt account email.",
      oauthTitle: "Google Sign-In",
      oauthSubtitle: "Finishing your Google sign-in.",
      linkInvalid:
        "The confirmation link is invalid or has expired.",
      linkInvalidResend:
        "This confirmation link is invalid or has expired. Request a new one from the sign-in screen.",
      linkMissing:
        "This link arrived without its verification code. If you were resetting your password, request a fresh recovery link — otherwise request a new confirmation email.",
      confirmed: "Your email is confirmed. Taking you to your dashboard.",
      signedInGoogle:
        "Signed in with Google. Taking you to your dashboard.",
      signedIn: "You are signed in. Taking you to your dashboard.",
      googleIncomplete:
        "Google sign-in was not completed. Please try again from the sign-in screen.",
      continueToDashboard: "Continue to Dashboard",
      backToSignIn: "Back to Sign In",
      goToResetPassword: "Go to Reset Password",
      footerPrompt: "Need a new account?",
      footerAction: "Create Account",
    },
  },

  menu: {
    language: {
      title: "Language",
      chooseLanguage: "Choose language",
      current: "Current: {{language}}",
      comingSoon: "Coming soon",
      comingSoonA11y: "{{language}}, coming soon, not yet available",
    },
  },

  admin: {
    title: "Admin Dashboard",
    subtitle:
      "System oversight preview — mock data until admin reads land.",
  },
} as const;

export default en;
export type EnStrings = typeof en;
