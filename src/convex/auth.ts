// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { emailOtp } from "./auth/emailOtp";

// Email OTP only. Anonymous/guest sign-in was removed deliberately: every
// account must be linked to a school through onboarding (create or invite).

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp],
});