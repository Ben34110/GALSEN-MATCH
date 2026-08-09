import { redirect } from "next/navigation";

// No splash screen — go straight into the onboarding wizard, which already
// bounces returning visitors (profile in localStorage, or a signed-in
// account) straight to /actu itself (see app/onboarding/page.tsx). Installed
// PWA users skip this route entirely (manifest start_url is /actu).
export default function RootPage() {
  redirect("/onboarding");
}
