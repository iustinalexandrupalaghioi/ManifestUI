import { AccountFrame } from "@/components/site/AccountFrame";

/** Login, sign-up and password reset, in the site's account frame. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AccountFrame>{children}</AccountFrame>;
}
