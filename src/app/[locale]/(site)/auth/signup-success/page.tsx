import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, authLink } from "@/framework/authentication/ui/AuthCard";

export default async function Page() {
  const t = await getTranslations("AuthForms.signupSuccess");

  return (
    <AuthCard
      title={t("title")}
      description={t("description")}
      footer={
        <Link href="/auth/login" className={authLink}>
          {t("backToLogin")}
        </Link>
      }
    >
      <p className="m-0 text-sm leading-relaxed text-muted-foreground">{t("message")}</p>
    </AuthCard>
  );
}
