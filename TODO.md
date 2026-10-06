# AdlaWatt — To Do

## First Page

- [x] Login: Add Continue with Google / OAuth — **Resolved**
  - Official multicolor Google G icon (`GoogleGIcon.tsx`) on login + register
  - `signInWithGoogle()` in `auth.ts` (web redirect + native auth-session with PKCE code exchange)
  - Supabase Google provider enabled; client forces `flowType: 'pkce'`
  - Callback handles implicit-hash fallback, live-session check, Google-specific header/copy
- [x] Login: Add Forgot Password — **Resolved**
  - Recovery links land directly on `/auth/forgot-password` and verify in-screen (no callback UI)
  - Verified card morphs: success message + Continue to Account, opt-in password-change expander
  - Signed-in bounce exemption while a recovery link verifies
- [x] Login: Password visibility should only be available for 5 seconds
- [ ] Overall: Display only the toggle that has content
  - Example: If there are no advisable devices, display the default toggle for Not Advisable Devices
- [ ] Navbar Upper: Display username
- [ ] Appliances: Add image upload inside the Custom Appliance box with a media picker modal
- [ ] Analytics: Add more graphs and charts
  - Note: Critical
- [ ] Preferences: Add phone vibration for alert notifications
  - Vibration should continue until the notification is marked as done
- [ ] Preferences: Add multi-language display
- [ ] User Manual: Add manual contents inside its screen

## Second Page

- [ ] Account Profile: Maintain a fixed height when the Update button is clicked
- [ ] Account Profile: Remove the black border from the password field
