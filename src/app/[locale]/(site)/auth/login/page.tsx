import { LoginForm } from "@/framework/authentication/ui/LoginForm";

// Rendered per request: the form reads the URL (?next=…). The site layout is static, so this page opts out on its own.
export const dynamic = "force-dynamic";

export default function Page() {
  return <LoginForm />;
}
