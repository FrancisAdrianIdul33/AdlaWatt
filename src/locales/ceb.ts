// ============================================================
// CEBUANO (draft translations for native review — keys
// mirror en.ts exactly)
// ============================================================

const ceb = {
  common: {
    or: "O",
    resendIn: "Ipadala pag-usab sa {{seconds}}s",
    resending: "Gipadala pag-usab...",
    wentWrong:
      "May sayop nga nahitabo. Palihug sulayi pag-usab.",
    noConnection:
      "Walay koneksyon. Susiha ang imong internet ug sulayi pag-usab.",
    tooManyRequests:
      "Sobra kadaghan ang pagsulay. Paghulat ug sulayi pag-usab.",
    confirmationThrottled:
      "Bag-o lang nagpadala ug confirmation email. Paghulat sa dili pa mangayo pag-usab.",
    authRequired: "Walay naka-authenticate nga user.",
    accountLoadFailed:
      "Dili ma-load ang impormasyon sa imong account.",
  },

  validation: {
    emailRequired: "Palihug isulod ang imong email address.",
    emailInvalid:
      "Palihug isulod ang balido nga email address.",
    usernameRequired: "Palihug isulod ang username.",
    usernameShort:
      "Ang username kinahanglan dili mominus sa 3 ka karakter.",
    usernameLong:
      "Ang username dili molapas sa 30 ka karakter.",
    usernameChars:
      "Ang username mahimo lang nga adunay mga letra, numero, ug underscore.",
    passwordShort:
      "Ang password kinahanglan dili mominus sa 8 ka karakter.",
    passwordLong:
      "Ang password dili molapas sa 72 ka karakter.",
    passwordsMismatch:
      "Dili magtugma ang mga password. Palihug susiha ang duha ka password field.",
    identifierRequired:
      "Palihug isulod ang imong username o email ug password.",
    identifierEmpty:
      "Palihug isulod ang imong username o email.",
    passwordEmpty: "Palihug isulod ang imong password.",
    termsRequired: "Palihug uyon sa Terms and Conditions.",
    termsRequiredLong:
      "Palihug uyon sa Terms and Conditions sa dili pa buhaton ang imong account.",
  },

  passwordInput: {
    labelPassword: "Password",
    labelNewPassword: "Bag-ong Password",
    labelConfirmNewPassword:
      "Kumpirmahi ang Bag-ong Password",
    placeholderPassword: "Isulod ang imong password",
    placeholderNewPassword: "Pagbuhat ug password",
    placeholderConfirmPassword:
      "Kumpirmahi ang imong password",
    placeholderCreateNew: "Pagbuhat ug bag-ong password",
    placeholderConfirmNew:
      "Kumpirmahi ang imong bag-ong password",
    showA11y: "Ipakita ang password sulod sa 5 segundos",
    showHint: "Nagpakita sa password sulod sa 5 segundos",
    hideA11y:
      "Tagoa ang password, awtomatikong motago sa {{seconds}} ka segundos",
    hideHint:
      "Makita ang password ug awtomatikong motago",
    visibleLive:
      "Makita ang password, motago sa {{seconds}} ka segundos",
    visibleHint:
      "Nagpakita sa password… motago sa {{seconds}}s",
  },

  auth: {
    login: {
      title: "Maayong Pagbalik",
      subtitle:
        "Pag-sign in aron magpadayon sa paggamit sa AdlaWatt.",
      identifierLabel: "Username o Email",
      identifierPlaceholder:
        "Isulod ang imong username o email",
      forgotPassword: "Nalimtan ang Password?",
      forgotPasswordLabel: "Nalimtan ang password",
      forgotPasswordHint:
        "Bawi-a ang imong password pinaagi sa email",
      signIn: "Pag-Sign In",
      signingIn: "Nag-sign In...",
      dividerOr: "O",
      continueWithGoogle: "Padayon gamit ang Google",
      connecting: "Nagkonek...",
      googleA11y: "Padayon gamit ang Google",
      googleHint:
        "Pag-sign in gamit ang imong Google account",
      invalidCredentials: "Sayop ang username o password.",
      signInFailed:
        "Dili ka namo ma-sign in. Palihug susiha ang imong impormasyon ug sulayi pag-usab.",
      sessionFailed: "Dili makabuhat ug login session.",
      sessionFailedNow:
        "Dili makapag-sign in karon. Palihug sulayi pag-usab.",
      emailNotConfirmed:
        "Palihug kumpirmahi ang imong email address sa dili pa mag-sign in. Susiha ang imong inbox para sa confirmation link.",
      tooManyAttempts:
        "Sobra kadaghan ang pagsulay sa pag-sign in. Paghulat ug sulayi pag-usab.",
      googleUnavailable:
        "Dili available ang Google sign-in karon. Palihug sulayi pag-usab.",
      googleIncomplete:
        "Wala mahuman ang Google sign-in. Palihug sulayi pag-usab.",
      googleFailed:
        "Dili makapag-sign in gamit ang Google karon. Palihug sulayi pag-usab.",
      verifyTitle: "I-verify ang Imong Email",
      verifySent: "• Napadala",
      verifyTo: "Ngadto kang:",
      verifyBody:
        "Kinahanglan ug beripikasyon ang imong account sa dili pa ka makapag-sign in.",
      verifySentFresh:
        "Bag-o lang namo gipadala ug confirmation link. Susiha ang imong inbox.",
      verifySentRecent:
        "Bag-o lang nagpadala ug link. Pindota ang resend sa ubos kung wala pa kini moabot.",
      verifySendFresh:
        "Pindota ang resend sa ubos para sa bag-ong confirmation link.",
      resendConfirmation:
        "Ipadala pag-usab ang confirmation email",
      footerPrompt: "Wala pa kay account?",
      footerAction: "Pagbuhat ug Account",
    },

    register: {
      title: "Pagbuhat ug Account",
      subtitle:
        "Buhata ang imong AdlaWatt account aron sugdan ang pagmonitor sa imong enerhiya.",
      usernameLabel: "Username",
      usernamePlaceholder: "Isulod ang imong username",
      emailLabel: "Email Address",
      emailPlaceholder: "Isulod ang imong email",
      agreePrefix: "Mouyon ako sa ",
      termsLink: "Terms and Conditions",
      agreeA11y: "Uyon sa Terms and Conditions",
      openTermsA11y: "Ablihi ang Terms and Conditions",
      createAccount: "Pagbuhat ug Account",
      creatingAccount: "Naghimo ug Account...",
      accountFailed: "Dili mabuhat ang imong account.",
      accountTaken:
        "Dili mabuhat ang imong account gamit kini nga mga detalye. Sulayi pag-sign in hinuon.",
      tooManyAttempts:
        "Sobra kadaghan ang pagsulay. Paghulat ug sulayi pag-usab.",
      accountNotCreated: "Dili mabuhat ang account.",
      accountFailedNow:
        "Dili mabuhat ang imong account. Palihug sulayi pag-usab.",
      checkEmailTitle: "Susiha ang imong email",
      confirmationSent:
        "Nagpadala kami ug confirmation link sa {{email}}. I-click ang link aron i-verify ang imong account, dayon pag-sign in.",
      resendConfirmation:
        "Ipadala pag-usab ang confirmation email",
      continueToSignIn: "Padayon sa Sign In",
      useDifferentEmail: "Paggamit ug laing email address",
      useDifferentEmailA11y:
        "Paggamit ug laing email address",
      resendFailed:
        "Dili mapadala pag-usab ang confirmation email.",
      footerPrompt: "Naana kay account?",
      footerAction: "Pag-Sign In",
      googleHint: "Pagbuhat ug imong account gamit ang Google",
    },

    forgot: {
      title: "I-reset ang Password",
      subtitleRequest:
        "Isulod ang email sa imong account. Padad-an ka namo ug recovery link.",
      subtitleVerified:
        "Nakumpirma ang imong email. Padayon sa imong account o pagbutang ug bag-ong password.",
      emailLabel: "Email Address",
      emailPlaceholder: "Isulod ang imong email",
      sendLink: "Ipadala ang Recovery Link",
      sending: "Gipadala...",
      sendFailed:
        "Dili makapadala ug recovery email karon. Palihug sulayi pag-usab.",
      recoveryThrottled:
        "Bag-o lang nagpadala ug recovery email. Paghulat sa dili pa mangayo pag-usab.",
      recoveryFailed:
        "Dili makapadala ug recovery email karon. Palihug sulayi pag-usab.",
      recoveryLinkBad:
        "Dili balido o na-expire na kini nga recovery link. Pagpangayo ug bag-o sa ubos.",
      recoveryLinkWrong:
        "Dili kini password recovery link. Pagpangayo ug bag-ong recovery email sa ubos.",
      recoveryExpired:
        "Dili balido o na-expire na kini nga recovery link. Pagpangayo ug bag-o.",
      recoveryUpdateFailed:
        "Dili ma-update ang imong password karon. Palihug sulayi pag-usab.",
      checkEmailTitle: "Susiha ang Imong Email",
      checkEmailSent: "• Napadala",
      checkEmailTo: "Ngadto kang:",
      checkEmailInbox: "imong inbox",
      checkEmailBody:
        "Nagpadala kami ug recovery link. I-tap kini, dayon pagbutang ug bag-ong password.",
      resendRecovery: "Ipadala pag-usab ang recovery email",
      checkEmailHint:
        "Wala madawat? Susiha ang spam o sulayi ug laing address.",
      verifyingTitle: "Gina-verify ang Link",
      verifyingBody: "Gina-verify ang imong recovery link…",
      verifiedTitle: "Nakumpirma ang Email",
      verifiedBody:
        "Malampuson nimong nakumpirma ang imong email.",
      continueToAccount: "Padayon sa Account",
      showChangeForm:
        "O gusto ba nimong usbon ang imong password?",
      hideChangeForm: "Tagoa ang mga password field",
      showChangeFormA11y:
        "Ipakita ang form sa pag-usab sa password",
      hideChangeFormA11y:
        "Tagoa ang form sa pag-usab sa password",
      changeFormHint:
        "Nagpakita sa bag-ong mga password field",
      updatePassword: "I-update ang Password",
      updating: "Gina-update...",
      recoveryEmailSent: "Napadala ang recovery email",
      verifyingLink: "Gina-verify ang recovery link",
      emailConfirmed: "Nakumpirma ang email",
      footerPrompt: "Nahinumdom ka sa imong password?",
      footerAction: "Balik sa Sign In",
    },

    callback: {
      title: "Kumpirmasyon sa Email",
      subtitle:
        "Gina-kumpirma ang email sa imong AdlaWatt account.",
      oauthTitle: "Google Sign-In",
      oauthSubtitle: "Ginatapos ang imong Google sign-in.",
      linkInvalid:
        "Dili balido o na-expire na ang confirmation link.",
      linkInvalidResend:
        "Dili balido o na-expire na kini nga confirmation link. Pagpangayo ug bag-o gikan sa sign-in screen.",
      linkMissing:
        "Miabot kini nga link nga walay verification code. Kung nag-reset ka sa imong password, pagpangayo ug bag-ong recovery link — kung dili, pagpangayo ug bag-ong confirmation email.",
      confirmed:
        "Nakumpirma ang imong email. Dad-on ka sa imong dashboard.",
      signedInGoogle:
        "Naka-sign in gamit ang Google. Dad-on ka sa imong dashboard.",
      signedIn:
        "Naka-sign in ka. Dad-on ka sa imong dashboard.",
      googleIncomplete:
        "Wala mahuman ang Google sign-in. Palihug sulayi pag-usab gikan sa sign-in screen.",
      continueToDashboard: "Padayon sa Dashboard",
      backToSignIn: "Balik sa Sign In",
      goToResetPassword: "Adto sa Reset Password",
      footerPrompt: "Kinahanglan ug bag-ong account?",
      footerAction: "Pagbuhat ug Account",
    },
  },

  menu: {
    language: {
      title: "Pinulongan",
      chooseLanguage: "Pagpili ug pinulongan",
      current: "Karon: {{language}}",
      comingSoon: "Moabotay",
      comingSoonA11y:
        "{{language}}, moabotay, dili pa available",
    },
  },
} as const;

export default ceb;
