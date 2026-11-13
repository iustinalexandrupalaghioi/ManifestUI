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
      <div className="mx-auto my-10 max-w-2xl px-4 text-center text-muted-foreground">
        {t("profile.notReady")}
      </div>
    );
  }

  return <ProfileForm profile={profile} />;
}
