"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CameraIcon,
  KeyRoundIcon,
  PencilIcon,
  SettingsIcon,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError } from "@/framework/lib/toast";
import { updateProfile } from "../actions/update-profile";
import { resolveAvatarUrl } from "@/framework/authentication/lib/resolveAvatarUrl";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import type { FullUserProfile } from "@/app/[locale]/(site)/data/fetchFullUserProfile";

function makeProfileSchema(t: ReturnType<typeof useTranslations<"AuthForms">>) {
  return z.object({
    full_name: z.string().trim().min(2, t("validation.fullNameRequired")),
    email: z
      .string()
      .trim()
      .pipe(z.email(t("validation.invalidEmail"))),
    phone: z.string().trim().optional(),
  });
}

type ProfileFormValues = z.infer<ReturnType<typeof makeProfileSchema>>;

function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function ProfileForm({
  profile,
  className,
  ...props
}: { profile: FullUserProfile } & React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("AuthForms");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile.full_name || profile.email || "—";
  const displayEmail = profile.email;
  const displayPhone = profile.phone;

  const avatarUrl = localAvatarPreview ?? resolveAvatarUrl(profile);

  useEffect(() => {
    setLocalAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingAvatarFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.avatar_path]);

  const uploadAvatar = async (file: File) => {
    const url = `/api/avatars/${profile.id}?filename=${encodeURIComponent(file.name)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `Upload failed: ${res.status}`);
    }
  };

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (localAvatarPreview) URL.revokeObjectURL(localAvatarPreview);
    setPendingAvatarFile(file);
    setLocalAvatarPreview(URL.createObjectURL(file));
  };

  const profileSchema = useMemo(() => makeProfileSchema(t), [t]);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile.full_name, profile.email, profile.phone]);

  const onSubmit = (values: ProfileFormValues) => {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
      });

      if (!result.ok) {
        toastError(result.error.message);
        return;
      }

      toastSuccess(t("profile.saveSuccess"));
      if (result.data.emailChangePending) {
        toastSuccess(t("profile.emailChangePending"));
      }

      if (pendingAvatarFile) {
        uploadAvatar(pendingAvatarFile)
          .then(() => router.refresh())
          .catch((err: Error) => toastError(err.message));
      }

      setIsEditing(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    form.reset({
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
    });
    if (localAvatarPreview) URL.revokeObjectURL(localAvatarPreview);
    setPendingAvatarFile(null);
    setLocalAvatarPreview(null);
    setIsEditing(false);
  };

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-md mx-auto my-10", className)}
      {...props}
    >
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="size-12">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback>
                    {displayName ? initials(displayName) : "?"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <CameraIcon className="size-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelected}
                    />
                  </>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{displayName}</span>
                <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                  <span>{displayEmail || "—"}</span>
                  {displayPhone && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{displayPhone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="text-muted-foreground" />
                    {t("profile.settings")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-fit">
                  <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                    <PencilIcon className="text-muted-foreground" />
                    {t("profile.editProfile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/update-password">
                      <KeyRoundIcon className="text-muted-foreground" />
                      {t("profile.changePasswordLink")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing && (
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormInput<ProfileFormValues>
                  name="full_name"
                  label={t("profile.fullNameLabel")}
                />
                <FormInput<ProfileFormValues>
                  name="email"
                  label={t("profile.emailLabel")}
                  type="email"
                />
                <FormInput<ProfileFormValues>
                  name="phone"
                  label={t("profile.phoneLabel")}
                />

                <div className="flex w-full flex-col gap-2 pt-2 md:flex-row-reverse">
                  <Button
                    type="submit"
                    className="w-full md:flex-1"
                    disabled={isPending}
                  >
                    {isPending ? t("profile.submitting") : t("profile.submit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full md:flex-1"
                    disabled={isPending}
                    onClick={handleCancel}
                  >
                    {t("profile.cancel")}
                  </Button>
                </div>
              </form>
            </FormProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
