import { getTranslations } from "next-intl/server";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { fetchFullUserProfile } from "../data/fetchFullUserProfile";
import { ProfileForm } from "@/framework/authentication/ui/ProfileForm";

export default async function Page() {
  const userId = await getCurrentUserId();
  const profile = userId ? await fetchFullUserProfile(userId) : null;

  if (!profile) {
    const t = await getTranslations("AuthForms");
    return (
      <p className="m-0 mx-auto max-w-md text-center text-base leading-relaxed text-muted-foreground">
        {t("profile.notReady")}
      </p>
    );
  }

  return <ProfileForm profile={profile} />;
}
