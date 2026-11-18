"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { signup } from "../actions/signup";
import { loginWithGoogle } from "../actions/login-with-google";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";
import {
  AuthCard,
  AuthDivider,
  authLink,
  authPrimaryButton,
  authSecondaryButton,
} from "./AuthCard";

function makeSignUpSchema(t: ReturnType<typeof useTranslations<"AuthForms">>) {
  return z
    .object({
      fullName: z.string().trim().min(2, t("validation.fullNameRequired")),
      email: z
        .string()
        .trim()
        .pipe(z.email(t("validation.invalidEmail"))),
      password: z
        .string()
        .min(8, t("validation.passwordMinLength"))
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[0-9]/, t("validation.passwordNumber")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });
}

type SignUpFormValues = z.infer<ReturnType<typeof makeSignUpSchema>>;

export function SignUpForm(
  props: Omit<React.ComponentPropsWithoutRef<"div">, "title">,
) {
  const t = useTranslations("AuthForms");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const signUpSchema = useMemo(() => makeSignUpSchema(t), [t]);
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: SignUpFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await signup(
        values.fullName,
        values.email,
        values.password,
      );
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push("/auth/signup-success");
    });
  };

  return (
    <AuthCard
      title={t("signup.title")}
      description={t("signup.description")}
      footer={
        <>
          {t("signup.haveAccount")}{" "}
          <Link href="/auth/login" className={authLink}>
            {t("signup.loginLink")}
          </Link>
        </>
      }
      {...props}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormInput<SignUpFormValues>
            name="fullName"
            label={t("signup.fullNameLabel")}
            placeholder={t("signup.fullNamePlaceholder")}
          />
          <FormInput<SignUpFormValues>
            name="email"
            label={t("signup.emailLabel")}
            type="email"
            placeholder={t("signup.emailPlaceholder")}
          />
          <FormPasswordInput<SignUpFormValues>
            name="password"
            label={t("signup.passwordLabel")}
            placeholder="••••••••••••"
          />
          <FormPasswordInput<SignUpFormValues>
            name="confirmPassword"
            label={t("signup.confirmPasswordLabel")}
            placeholder="••••••••••••"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className={authPrimaryButton}
            disabled={isPending}
          >
            {isPending ? t("signup.submitting") : t("signup.submit")}
          </Button>

          <AuthDivider>{t("or")}</AuthDivider>

          <Button
            type="button"
            variant="outline"
            className={authSecondaryButton}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await loginWithGoogle();
              })
            }
          >
            <img className="h-4 w-4" src="/google-icon-logo.svg" alt="" />
            {t("continueWithGoogle")}
          </Button>

        </form>
      </FormProvider>
    </AuthCard>
  );
}
