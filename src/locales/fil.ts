// ============================================================
// FILIPINO (draft translations for native review — keys
// mirror en.ts exactly)
// ============================================================

const fil = {
  common: {
    or: "O",
    resendIn: "Muling ipadala sa {{seconds}}s",
    resending: "Muling ipinapadala...",
    wentWrong:
      "May naganap na mali. Pakisubukang muli.",
    noConnection:
      "Walang koneksyon. Suriin ang iyong internet at subukang muli.",
    tooManyRequests:
      "Masyadong maraming pagtatangka. Maghintay sandali at subukang muli.",
    confirmationThrottled:
      "Kamakailan ay nagpadala ng confirmation email. Maghintay bago humiling ng panibago.",
    authRequired: "Walang naka-authenticate na user.",
    accountLoadFailed:
      "Hindi ma-load ang impormasyon ng iyong account.",
  },

  validation: {
    emailRequired: "Pakilagay ang iyong email address.",
    emailInvalid: "Pakilagay ang wastong email address.",
    usernameRequired: "Pakilagay ang username.",
    usernameShort:
      "Ang username ay dapat na hindi bababa sa 3 karakter.",
    usernameLong:
      "Ang username ay hindi dapat lumampas sa 30 karakter.",
    usernameChars:
      "Ang username ay maaari lamang maglaman ng mga letra, numero, at underscore.",
    passwordShort:
      "Ang password ay dapat na hindi bababa sa 8 karakter.",
    passwordLong:
      "Ang password ay hindi dapat lumampas sa 72 karakter.",
    passwordsMismatch:
      "Hindi tugma ang mga password. Pakisuri ang parehong password field.",
    identifierRequired:
      "Pakilagay ang iyong username o email at password.",
    identifierEmpty:
      "Pakilagay ang iyong username o email.",
    passwordEmpty: "Pakilagay ang iyong password.",
    termsRequired:
      "Pakisang-ayunan ang Terms and Conditions.",
    termsRequiredLong:
      "Pakisang-ayunan ang Terms and Conditions bago likhain ang iyong account.",
  },

  passwordInput: {
    labelPassword: "Password",
    labelNewPassword: "Bagong Password",
    labelConfirmNewPassword:
      "Kumpirmahin ang Bagong Password",
    placeholderPassword: "Ilagay ang iyong password",
    placeholderNewPassword: "Lumikha ng password",
    placeholderConfirmPassword:
      "Kumpirmahin ang iyong password",
    placeholderCreateNew: "Lumikha ng bagong password",
    placeholderConfirmNew:
      "Kumpirmahin ang iyong bagong password",
    showA11y: "Ipakita ang password sa loob ng 5 segundo",
    showHint: "Ipinapakita ang password sa loob ng 5 segundo",
    hideA11y:
      "Itago ang password, awtomatikong magtatago sa loob ng {{seconds}} segundo",
    hideHint:
      "Nakikita ang password at awtomatikong magtatago",
    visibleLive:
      "Nakikitang password, magtatago sa loob ng {{seconds}} segundo",
    visibleHint:
      "Ipinapakita ang password… magtatago sa loob ng {{seconds}}s",
  },

  auth: {
    login: {
      title: "Maligayang Pagbabalik",
      subtitle:
        "Mag-sign in upang magpatuloy sa paggamit ng AdlaWatt.",
      identifierLabel: "Username o Email",
      identifierPlaceholder:
        "Ilagay ang iyong username o email",
      forgotPassword: "Nakalimutan ang Password?",
      forgotPasswordLabel: "Nakalimutan ang password",
      forgotPasswordHint:
        "Bawiin ang iyong password sa pamamagitan ng email",
      signIn: "Mag-Sign In",
      signingIn: "Nagsa-sign In...",
      dividerOr: "O",
      continueWithGoogle: "Magpatuloy gamit ang Google",
      connecting: "Kumokonekta...",
      googleA11y: "Magpatuloy gamit ang Google",
      googleHint:
        "Mag-sign in gamit ang iyong Google account",
      invalidCredentials: "Mali ang username o password.",
      signInFailed:
        "Hindi ka namin ma-sign in. Pakisuri ang iyong impormasyon at subukang muli.",
      sessionFailed: "Hindi makalikha ng login session.",
      sessionFailedNow:
        "Hindi makapag-sign in sa ngayon. Pakisubukang muli.",
      emailNotConfirmed:
        "Pakikumpirma ang iyong email address bago mag-sign in. Suriin ang iyong inbox para sa confirmation link.",
      tooManyAttempts:
        "Masyadong maraming pagtatangka sa pag-sign in. Maghintay sandali at subukang muli.",
      googleUnavailable:
        "Hindi available ang Google sign-in sa ngayon. Pakisubukang muli.",
      googleIncomplete:
        "Hindi nakumpleto ang Google sign-in. Pakisubukang muli.",
      googleFailed:
        "Hindi makapag-sign in gamit ang Google sa ngayon. Pakisubukang muli.",
      verifyTitle: "I-verify ang Iyong Email",
      verifySent: "• Naipadala",
      verifyTo: "Para kay:",
      verifyBody:
        "Kailangan ng beripikasyon ang iyong account bago ka makapag-sign in.",
      verifySentFresh:
        "Kakalabas lang namin ng bagong confirmation link. Suriin ang iyong inbox.",
      verifySentRecent:
        "Kamakailan ay nagpadala ng link. Pindutin ang resend sa ibaba kung hindi pa ito dumarating.",
      verifySendFresh:
        "Pindutin ang resend sa ibaba para sa bagong confirmation link.",
      resendConfirmation:
        "Muling ipadala ang confirmation email",
      footerPrompt: "Wala ka pang account?",
      footerAction: "Lumikha ng Account",
      testAdminTitle: "Test admin account (dev only)",
      testAdminHint:
        "Mag-sign in gamit ang mga kredensyal na ito upang masilip ang admin dashboard.",
      testAdminEmailLabel: "Email",
      testAdminUsernameLabel: "Username",
      testAdminPasswordLabel: "Password",
    },

    register: {
      title: "Lumikha ng Account",
      subtitle:
        "Likhain ang iyong AdlaWatt account upang simulan ang pagmomonitor ng iyong enerhiya.",
      usernameLabel: "Username",
      usernamePlaceholder: "Ilagay ang iyong username",
      emailLabel: "Email Address",
      emailPlaceholder: "Ilagay ang iyong email",
      agreePrefix: "Sumasang-ayon ako sa ",
      termsLink: "Terms and Conditions",
      agreeA11y: "Sumang-ayon sa Terms and Conditions",
      openTermsA11y: "Buksan ang Terms and Conditions",
      createAccount: "Lumikha ng Account",
      creatingAccount: "Lumilikha ng Account...",
      accountFailed: "Hindi malikha ang iyong account.",
      accountTaken:
        "Hindi malikha ang iyong account gamit ang mga detalyeng ito. Subukang mag-sign in sa halip.",
      tooManyAttempts:
        "Masyadong maraming pagtatangka. Maghintay sandali at subukang muli.",
      accountNotCreated: "Hindi malikha ang account.",
      accountFailedNow:
        "Hindi malikha ang iyong account. Pakisubukang muli.",
      checkEmailTitle: "Suriin ang iyong email",
      confirmationSent:
        "Nagpadala kami ng confirmation link sa {{email}}. I-click ang link upang i-verify ang iyong account, pagkatapos ay mag-sign in.",
      resendConfirmation:
        "Muling ipadala ang confirmation email",
      continueToSignIn: "Magpatuloy sa Sign In",
      useDifferentEmail: "Gumamit ng ibang email address",
      useDifferentEmailA11y:
        "Gumamit ng ibang email address",
      resendFailed:
        "Hindi muling maipadala ang confirmation email.",
      footerPrompt: "May account ka na?",
      footerAction: "Mag-Sign In",
      googleHint: "Lumikha ng iyong account gamit ang Google",
    },

    forgot: {
      title: "I-reset ang Password",
      subtitleRequest:
        "Ilagay ang email ng iyong account. Padadalhan ka namin ng recovery link.",
      subtitleVerified:
        "Nakumpirma ang iyong email. Magpatuloy sa iyong account o magtakda ng bagong password.",
      emailLabel: "Email Address",
      emailPlaceholder: "Ilagay ang iyong email",
      sendLink: "Ipadala ang Recovery Link",
      sending: "Ipinapadala...",
      sendFailed:
        "Hindi makapagpadala ng recovery email sa ngayon. Pakisubukang muli.",
      recoveryThrottled:
        "Kamakailan ay nagpadala ng recovery email. Maghintay bago humiling ng panibago.",
      recoveryFailed:
        "Hindi makapagpadala ng recovery email sa ngayon. Pakisubukang muli.",
      recoveryLinkBad:
        "Hindi wasto o nag-expire na ang recovery link na ito. Humiling ng bago sa ibaba.",
      recoveryLinkWrong:
        "Hindi ito password recovery link. Humiling ng bagong recovery email sa ibaba.",
      recoveryExpired:
        "Hindi wasto o nag-expire na ang recovery link na ito. Humiling ng bago.",
      recoveryUpdateFailed:
        "Hindi ma-update ang iyong password sa ngayon. Pakisubukang muli.",
      checkEmailTitle: "Suriin ang Iyong Email",
      checkEmailSent: "• Naipadala",
      checkEmailTo: "Para kay:",
      checkEmailInbox: "iyong inbox",
      checkEmailBody:
        "Nagpadala kami ng recovery link. I-tap ito, pagkatapos ay magtakda ng bagong password.",
      resendRecovery: "Muling ipadala ang recovery email",
      checkEmailHint:
        "Hindi natanggap? Suriin ang spam o sumubok ng ibang address.",
      verifyingTitle: "Bine-verify ang Link",
      verifyingBody: "Bine-verify ang iyong recovery link…",
      verifiedTitle: "Nakumpirma ang Email",
      verifiedBody:
        "Matagumpay mong nakumpirma ang iyong email.",
      continueToAccount: "Magpatuloy sa Account",
      showChangeForm:
        "O gusto mo bang palitan ang iyong password?",
      hideChangeForm: "Itago ang mga password field",
      showChangeFormA11y:
        "Ipakita ang form ng pagpapalit ng password",
      hideChangeFormA11y:
        "Itago ang form ng pagpapalit ng password",
      changeFormHint:
        "Inilalantad ang mga bagong password field",
      updatePassword: "I-update ang Password",
      updating: "Ina-update...",
      recoveryEmailSent: "Naipadala ang recovery email",
      verifyingLink: "Bine-verify ang recovery link",
      emailConfirmed: "Nakumpirma ang email",
      footerPrompt: "Naalala mo ang iyong password?",
      footerAction: "Bumalik sa Sign In",
    },

    callback: {
      title: "Kumpirmasyon ng Email",
      subtitle:
        "Kinukumpirma ang email ng iyong AdlaWatt account.",
      oauthTitle: "Google Sign-In",
      oauthSubtitle: "Tinátapos ang iyong Google sign-in.",
      linkInvalid:
        "Hindi wasto o nag-expire na ang confirmation link.",
      linkInvalidResend:
        "Hindi wasto o nag-expire na ang confirmation link na ito. Humiling ng bago mula sa sign-in screen.",
      linkMissing:
        "Dumating ang link na ito nang walang verification code. Kung nire-reset mo ang iyong password, humiling ng bagong recovery link — kung hindi, humiling ng bagong confirmation email.",
      confirmed:
        "Nakumpirma ang iyong email. Dadalhin ka sa iyong dashboard.",
      signedInGoogle:
        "Naka-sign in gamit ang Google. Dadalhin ka sa iyong dashboard.",
      signedIn:
        "Naka-sign in ka. Dadalhin ka sa iyong dashboard.",
      googleIncomplete:
        "Hindi nakumpleto ang Google sign-in. Pakisubukang muli mula sa sign-in screen.",
      continueToDashboard: "Magpatuloy sa Dashboard",
      backToSignIn: "Bumalik sa Sign In",
      goToResetPassword: "Pumunta sa Reset Password",
      footerPrompt: "Kailangan ng bagong account?",
      footerAction: "Lumikha ng Account",
    },
  },

  menu: {
    language: {
      title: "Wika",
      chooseLanguage: "Pumili ng wika",
      current: "Kasalukuyan: {{language}}",
      comingSoon: "Malapit na",
      comingSoonA11y:
        "{{language}}, malapit na, hindi pa available",
    },
  },

  admin: {
    title: "Admin Dashboard",
    subtitle:
      "Preview ng pangangasiwa ng system — mock data muna.",
  },
} as const;

export default fil;
