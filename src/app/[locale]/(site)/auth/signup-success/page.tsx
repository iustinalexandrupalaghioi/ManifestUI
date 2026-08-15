import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Page() {
  const t = await getTranslations("AuthForms.signupSuccess");

  return (
    <div className="mx-auto my-10 flex max-w-96 flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("message")}</p>
          <Link
            href="/auth/login"
            className="text-sm underline underline-offset-4"
          >
            {t("backToLogin")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
