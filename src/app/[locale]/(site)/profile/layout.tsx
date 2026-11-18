import { AccountFrame } from "@/components/site/AccountFrame";

/** The profile, in the same frame as the auth screens. */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AccountFrame>{children}</AccountFrame>;
}
